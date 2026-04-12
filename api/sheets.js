import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

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
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'sheets.properties.title' });
    const exists = meta.data.sheets.some(s => s.properties.title === tabName);
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tabName } } }]
        }
      });
      // 헤더 행 추가
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${tabName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] }
      });
    }
  } catch (e) {
    console.error(`ensureSheet(${tabName}) error:`, e.message);
  }
  ensuredSheets[tabName] = true;
}

// ========================
// Sessions CRUD
// ========================
const SESSION_HEADERS = ['id', 'name', 'accessCode', 'status', 'version', 'teamCount', 'createdAt', 'singlePieceMode', 'dataJson'];
const GAMESTATE_HEADERS = ['sessionId', 'dataJson', 'lastUpdated'];

async function createSession(session) {
  await ensureSheet('Sessions', SESSION_HEADERS);
  const sheets = getSheets();
  const dataJson = JSON.stringify(session);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sessions!A:I',
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
        dataJson
      ]]
    }
  });
  invalidateCache('allSessions');
  return { success: true };
}

async function getAllSessions() {
  const cached = getCached('allSessions');
  if (cached) return cached;

  await ensureSheet('Sessions', SESSION_HEADERS);
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sessions!A:I'
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  const result = rows.slice(1).map(row => {
    try {
      // dataJson 컬럼에서 전체 데이터 복원
      const dataJson = row[8];
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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sessions!A:I'
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === sessionId);
  if (rowIndex === -1) return { success: false, error: 'Session not found' };

  // 기존 데이터 복원 후 업데이트
  let existingSession = {};
  try {
    if (rows[rowIndex][8]) existingSession = JSON.parse(rows[rowIndex][8]);
  } catch (e) { /* ignore */ }

  const updatedSession = { ...existingSession, ...updates };
  const dataJson = JSON.stringify(updatedSession);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Sessions!A${rowIndex + 1}:I${rowIndex + 1}`,
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
        dataJson
      ]]
    }
  });
  invalidateCache('allSessions');
  return { success: true };
}

async function deleteSession(sessionId) {
  await ensureSheet('Sessions', SESSION_HEADERS);
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sessions!A:I'
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === sessionId);
  if (rowIndex === -1) return { success: false };

  // 해당 행 클리어
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Sessions!A${rowIndex + 1}:I${rowIndex + 1}`
  });

  // GameState도 삭제
  await deleteGameState(sessionId);
  return { success: true };
}

// ========================
// GameState CRUD
// ========================

async function updateGameState(sessionId, updates) {
  await ensureSheet('GameState', GAMESTATE_HEADERS);
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'GameState!A:C'
  });
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
    // 기존 행 업데이트
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `GameState!A${rowIndex + 1}:C${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[sessionId, dataJson, mergedState.lastUpdated]] }
    });
  } else {
    // 새 행 추가
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'GameState!A:C',
      valueInputOption: 'RAW',
      requestBody: { values: [[sessionId, dataJson, mergedState.lastUpdated]] }
    });
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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'GameState!A:C'
  });
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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'GameState!A:C'
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === sessionId);
  if (rowIndex > 0) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `GameState!A${rowIndex + 1}:C${rowIndex + 1}`
    });
  }
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
      default:
        return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
    }
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error(`[API] ${action} error:`, error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
