import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// ========================
// 재시도 로직 (GaxiosError 500 / 429 대응)
// ========================
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1초

async function withRetry(fn, label = 'API call') {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.code || err?.response?.status || err?.status;
      const isRetryable = [429, 500, 502, 503].includes(status) ||
        (err.message && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota') || err.message.includes('Quota')));

      if (!isRetryable || attempt === MAX_RETRIES) {
        console.error(`[API] ${label} failed after ${attempt + 1} attempt(s):`, err.message);
        throw err;
      }

      const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`[API] ${label} attempt ${attempt + 1} failed (${status || err.message}), retrying in ${Math.round(delay)}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ========================
// 요청 큐 (동시 요청 제한 - 쿼터 보호)
// ========================
let activeRequests = 0;
const MAX_CONCURRENT = 5;
const requestQueue = [];

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      activeRequests++;
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      } finally {
        activeRequests--;
        if (requestQueue.length > 0) {
          const next = requestQueue.shift();
          next();
        }
      }
    };
    if (activeRequests < MAX_CONCURRENT) {
      run();
    } else {
      requestQueue.push(run);
    }
  });
}

// 서버 측 캐시 (Vercel 서버리스 함수의 warm instance에서 유지)
const cache = {};
const CACHE_TTL = 3000; // 3초 캐시

function getCached(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache[key] = { data, ts: Date.now() };
}

function invalidateCache(prefix) {
  Object.keys(cache).forEach(k => { if (k.startsWith(prefix)) delete cache[k]; });
}

let _auth;
function getAuth() {
  if (!_auth) {
    _auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      undefined,
      (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    );
  }
  return _auth;
}

let _sheets;
function getSheets() {
  if (!_sheets) _sheets = google.sheets({ version: 'v4', auth: getAuth() });
  return _sheets;
}

// ensureSheet 결과 캐시 (탭이 이미 있으면 재확인 불필요)
const ensuredSheets = {};

// ========================
// Helper: 시트 탭 자동 생성
// ========================
async function ensureSheet(tabName, headers) {
  if (ensuredSheets[tabName]) return; // 이미 확인됨
  const sheets = getSheets();
  try {
    const meta = await withRetry(
      () => sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'sheets.properties.title' }),
      `ensureSheet(${tabName}).get`
    );
    const exists = meta.data.sheets.some(s => s.properties.title === tabName);
    if (!exists) {
      await withRetry(
        () => sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            requests: [{ addSheet: { properties: { title: tabName } } }]
          }
        }),
        `ensureSheet(${tabName}).create`
      );
      // 헤더 행 추가
      await withRetry(
        () => sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${tabName}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headers] }
        }),
        `ensureSheet(${tabName}).headers`
      );
    }
  } catch (e) {
    console.error(`ensureSheet(${tabName}) error:`, e.message);
  }
  ensuredSheets[tabName] = true;
}

// ========================
// Sessions CRUD
// ========================
const SESSION_HEADERS = ['id', 'name', 'accessCode', 'status', 'version', 'teamCount', 'createdAt', 'singlePieceMode', 'dataJson', 'dataJson2', 'dataJson3'];
const GAMESTATE_HEADERS = ['sessionId', 'dataJson', 'lastUpdated'];

// Google Sheets 셀 한도 (50,000자) 대비 안전 마진
const CELL_CHAR_LIMIT = 49000;

// base64 이미지를 제거하여 데이터 크기 줄이기
function stripBase64Images(obj) {
  if (!obj) return obj;
  const cleaned = { ...obj };
  if (cleaned.customBoardImage && cleaned.customBoardImage.startsWith('data:')) {
    cleaned.customBoardImage = ''; // base64 이미지는 너무 커서 저장 불가
  }
  return cleaned;
}

// 긴 JSON을 여러 청크로 분할
function splitDataJson(jsonStr) {
  const chunks = [];
  for (let i = 0; i < jsonStr.length; i += CELL_CHAR_LIMIT) {
    chunks.push(jsonStr.substring(i, i + CELL_CHAR_LIMIT));
  }
  // 최대 3개 셀 (I, J, K열)
  while (chunks.length < 3) chunks.push('');
  return chunks.slice(0, 3);
}

// 분할된 JSON 청크를 복원
function joinDataJson(row) {
  let json = row[8] || '';
  if (row[9]) json += row[9];
  if (row[10]) json += row[10];
  return json;
}

async function createSession(session) {
  await ensureSheet('Sessions', SESSION_HEADERS);
  const sheets = getSheets();
  const cleaned = stripBase64Images(session);
  const dataJson = JSON.stringify(cleaned);
  const chunks = splitDataJson(dataJson);
  await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sessions!A:K',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          session.id,
          session.name,
          session.accessCode,
          session.status || 'active',
          session.version || '',
          session.teamCount || 0,
          session.createdAt || Date.now(),
          session.singlePieceMode ? 'true' : 'false',
          chunks[0],
          chunks[1],
          chunks[2]
        ]]
      }
    }),
    'createSession'
  ));
  invalidateCache('allSessions');
  return { success: true };
}

async function getAllSessions() {
  const cached = getCached('allSessions');
  if (cached) return cached;

  await ensureSheet('Sessions', SESSION_HEADERS);
  const sheets = getSheets();
  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sessions!A:K'
    }),
    'getAllSessions'
  ));
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  const result = rows.slice(1).map(row => {
    try {
      // dataJson 컬럼에서 전체 데이터 복원 (분할 저장 지원)
      const dataJson = joinDataJson(row);
      if (dataJson) {
        return JSON.parse(dataJson);
      }
    } catch (e) { /* parse 실패 시 기본 데이터 반환 */ }
    return {
      id: row[0],
      name: row[1],
      accessCode: row[2],
      status: row[3],
      version: row[4],
      teamCount: parseInt(row[5]) || 0,
      createdAt: parseInt(row[6]) || 0,
      singlePieceMode: row[7] === 'true',
      teams: []
    };
  }).filter(s => s && s.id);

  setCache('allSessions', result);
  return result;
}

async function getSessionByAccessCode(accessCode) {
  const sessions = await getAllSessions();
  return sessions.find(s => s.accessCode === accessCode) || null;
}

async function getSession(sessionId) {
  const sessions = await getAllSessions();
  return sessions.find(s => s.id === sessionId) || null;
}

async function updateSession(sessionId, updates) {
  await ensureSheet('Sessions', SESSION_HEADERS);
  const sheets = getSheets();
  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sessions!A:K'
    }),
    'updateSession.get'
  ));
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === sessionId);
  if (rowIndex === -1) return { success: false, error: 'Session not found' };

  // 기존 데이터 복원 후 업데이트 (분할 저장 지원)
  let existingSession = {};
  try {
    const existingJson = joinDataJson(rows[rowIndex]);
    if (existingJson) existingSession = JSON.parse(existingJson);
  } catch (e) { /* ignore */ }

  const updatedSession = stripBase64Images({ ...existingSession, ...updates });
  const dataJson = JSON.stringify(updatedSession);
  const chunks = splitDataJson(dataJson);

  await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Sessions!A${rowIndex + 1}:K${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          updatedSession.id || sessionId,
          updatedSession.name || '',
          updatedSession.accessCode || '',
          updatedSession.status || 'active',
          updatedSession.version || '',
          updatedSession.teamCount || 0,
          updatedSession.createdAt || 0,
          updatedSession.singlePieceMode ? 'true' : 'false',
          chunks[0],
          chunks[1],
          chunks[2]
        ]]
      }
    }),
    'updateSession.update'
  ));
  invalidateCache('allSessions');
  return { success: true };
}

async function deleteSession(sessionId) {
  await ensureSheet('Sessions', SESSION_HEADERS);
  const sheets = getSheets();
  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sessions!A:K'
    }),
    'deleteSession.get'
  ));
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === sessionId);
  if (rowIndex === -1) return { success: false };

  await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `Sessions!A${rowIndex + 1}:K${rowIndex + 1}`
    }),
    'deleteSession.clear'
  ));

  await deleteGameState(sessionId);
  return { success: true };
}

// ========================
// GameState CRUD
// ========================

async function updateGameState(sessionId, updates) {
  await ensureSheet('GameState', GAMESTATE_HEADERS);
  const sheets = getSheets();
  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'GameState!A:C'
    }),
    'updateGameState.get'
  ));
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === sessionId);

  let existingState = {};
  if (rowIndex > 0) {
    try {
      if (rows[rowIndex][1]) existingState = JSON.parse(rows[rowIndex][1]);
    } catch (e) { /* ignore */ }
  }

  const mergedState = { ...existingState, ...updates, sessionId, lastUpdated: Date.now() };
  const dataJson = JSON.stringify(mergedState);

  if (rowIndex > 0) {
    await enqueue(() => withRetry(
      () => sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `GameState!A${rowIndex + 1}:C${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[sessionId, dataJson, mergedState.lastUpdated]] }
      }),
      'updateGameState.update'
    ));
  } else {
    await enqueue(() => withRetry(
      () => sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'GameState!A:C',
        valueInputOption: 'RAW',
        requestBody: { values: [[sessionId, dataJson, mergedState.lastUpdated]] }
      }),
      'updateGameState.append'
    ));
  }
  invalidateCache('gameState');
  return { success: true };
}

async function getGameState(sessionId) {
  const cacheKey = `gameState_${sessionId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  await ensureSheet('GameState', GAMESTATE_HEADERS);
  const sheets = getSheets();
  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'GameState!A:C'
    }),
    'getGameState'
  ));
  const rows = res.data.values || [];
  const row = rows.find((r, i) => i > 0 && r[0] === sessionId);
  if (!row || !row[1]) return null;
  try {
    const result = JSON.parse(row[1]);
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    return null;
  }
}

async function deleteGameState(sessionId) {
  await ensureSheet('GameState', GAMESTATE_HEADERS);
  const sheets = getSheets();
  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'GameState!A:C'
    }),
    'deleteGameState.get'
  ));
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === sessionId);
  if (rowIndex > 0) {
    await enqueue(() => withRetry(
      () => sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: `GameState!A${rowIndex + 1}:C${rowIndex + 1}`
      }),
      'deleteGameState.clear'
    ));
  }
  return { success: true };
}

// ========================
// TeamResponses CRUD (문항별 팀 응답 행 단위 기록)
// ========================
const TEAM_RESPONSES_HEADERS = ['sessionId', 'turn', 'cardTitle', 'teamId', 'teamName', 'response', 'aiEvaluation', 'timestamp'];

async function saveTeamResponseRow(payload) {
  await ensureSheet('TeamResponses', TEAM_RESPONSES_HEADERS);
  const sheets = getSheets();
  const { sessionId, turn, cardTitle, teamId, teamName, response, aiEvaluation, timestamp } = payload;
  await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'TeamResponses!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          sessionId || '',
          turn || 0,
          cardTitle || '',
          teamId || '',
          teamName || '',
          response || '',
          aiEvaluation || '',
          timestamp || Date.now()
        ]]
      }
    }),
    'saveTeamResponseRow'
  ));
  return { success: true };
}

async function getTeamResponseRows(sessionId) {
  await ensureSheet('TeamResponses', TEAM_RESPONSES_HEADERS);
  const sheets = getSheets();
  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'TeamResponses!A:H'
    }),
    'getTeamResponseRows'
  ));
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  return rows.slice(1)
    .filter(row => row[0] === sessionId)
    .map(row => ({
      sessionId: row[0],
      turn: parseInt(row[1]) || 0,
      cardTitle: row[2] || '',
      teamId: row[3] || '',
      teamName: row[4] || '',
      response: row[5] || '',
      aiEvaluation: row[6] || '',
      timestamp: parseInt(row[7]) || 0
    }));
}

async function updateTeamResponseAiEvaluation(payload) {
  await ensureSheet('TeamResponses', TEAM_RESPONSES_HEADERS);
  const sheets = getSheets();
  const { sessionId, turn, teamId, aiEvaluation } = payload;

  const res = await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'TeamResponses!A:H'
    }),
    'updateTeamResponseAiEvaluation.get'
  ));
  const rows = res.data.values || [];

  // sessionId + turn + teamId로 매칭되는 행 찾기
  const rowIndex = rows.findIndex((row, i) =>
    i > 0 && row[0] === sessionId && String(row[1]) === String(turn) && row[3] === teamId
  );

  if (rowIndex === -1) return { success: false, error: 'Row not found' };

  // G열(aiEvaluation)만 업데이트
  await enqueue(() => withRetry(
    () => sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `TeamResponses!G${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[aiEvaluation || '']] }
    }),
    'updateTeamResponseAiEvaluation.update'
  ));

  return { success: true };
}

// ========================
// Request Handler
// ========================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { action, payload } = req.body;

  try {
    let data;
    switch (action) {
      case 'createSession':
        data = await createSession(payload);
        break;
      case 'getAllSessions':
        data = await getAllSessions();
        break;
      case 'getSession':
        data = await getSession(payload.sessionId);
        break;
      case 'getSessionByAccessCode':
        data = await getSessionByAccessCode(payload.accessCode);
        break;
      case 'updateSession':
        data = await updateSession(payload.sessionId, payload.updates);
        break;
      case 'deleteSession':
        data = await deleteSession(payload.sessionId);
        break;
      case 'updateGameState':
        data = await updateGameState(payload.sessionId, payload.updates);
        break;
      case 'getGameState':
        data = await getGameState(payload.sessionId);
        break;
      case 'saveTeamResponseRow':
        data = await saveTeamResponseRow(payload);
        break;
      case 'getTeamResponseRows':
        data = await getTeamResponseRows(payload.sessionId);
        break;
      case 'updateTeamResponseAiEvaluation':
        data = await updateTeamResponseAiEvaluation(payload);
        break;
      default:
        return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
    }
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error(`[API] ${action} error:`, error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
