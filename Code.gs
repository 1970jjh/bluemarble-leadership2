/**
 * 브루마블 리더십 보드게임 - Google Apps Script Backend
 *
 * Deploy: Extensions > Apps Script > Deploy as Web App
 * Access: Anyone
 *
 * 시트 구조:
 *   Sessions : 세션 정보 (JSON)
 *   GameState : 게임 상태 (JSON)
 *   TurnLog  : 턴 기록 (열람용)
 */

var SPREADSHEET_ID = '1aiTp_TkgiQdSmu4IJQ1Py3uCkWhAIqFvnzYyLAXc1ns';
var DRIVE_FOLDER_ID = '1wY6I_wRuFTBKY1YA6T2mjo12lMTHZMNz';

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);

    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;

    switch (action) {
      case 'createSession':
        result = handleCreateSession(data);
        break;
      case 'updateSession':
        result = handleUpdateSession(data);
        break;
      case 'deleteSession':
        result = handleDeleteSession(data);
        break;
      case 'updateGameState':
        result = handleUpdateGameState(data);
        break;
      case 'appendTurnLog':
        result = handleAppendTurnLog(data);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    lock.releaseLock();
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var result;

    switch (action) {
      case 'getAllSessions':
        result = handleGetAllSessions();
        break;
      case 'getSession':
        result = handleGetSession(e.parameter.sessionId);
        break;
      case 'getSessionByAccessCode':
        result = handleGetSessionByAccessCode(e.parameter.accessCode);
        break;
      case 'getGameState':
        result = handleGetGameState(e.parameter.sessionId);
        break;
      case 'ping':
        result = { success: true, timestamp: Date.now() };
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============ SESSION MANAGEMENT ============

function handleCreateSession(data) {
  var sheet = getOrCreateSheet('Sessions');
  ensureHeaders(sheet, ['SessionId', 'SessionJSON', 'CreatedAt', 'LastUpdated']);

  var sessionJson = data.sessionJson;
  var session = JSON.parse(sessionJson);

  sheet.appendRow([
    session.id,
    sessionJson,
    new Date().toISOString(),
    new Date().toISOString()
  ]);

  // 게임 상태 초기화
  if (data.gameStateJson) {
    var gsSheet = getOrCreateSheet('GameState');
    ensureHeaders(gsSheet, ['SessionId', 'StateJSON', 'LastUpdated']);
    gsSheet.appendRow([
      session.id,
      data.gameStateJson,
      new Date().toISOString()
    ]);
  }

  return { success: true };
}

function handleUpdateSession(data) {
  var sheet = getOrCreateSheet('Sessions');
  var row = findRowByColumn(sheet, 1, data.sessionId);

  if (row <= 0) {
    return { success: false, error: 'Session not found: ' + data.sessionId };
  }

  sheet.getRange(row, 2).setValue(data.sessionJson);
  sheet.getRange(row, 4).setValue(new Date().toISOString());

  return { success: true };
}

function handleDeleteSession(data) {
  var sessionId = data.sessionId;

  // Sessions 시트에서 삭제
  var sheet = getOrCreateSheet('Sessions');
  var row = findRowByColumn(sheet, 1, sessionId);
  if (row > 0) {
    sheet.deleteRow(row);
  }

  // GameState 시트에서 삭제
  var gsSheet = getOrCreateSheet('GameState');
  var gsRow = findRowByColumn(gsSheet, 1, sessionId);
  if (gsRow > 0) {
    gsSheet.deleteRow(gsRow);
  }

  return { success: true };
}

function handleGetAllSessions() {
  var sheet = getOrCreateSheet('Sessions');
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, data: [] };

  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var sessions = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      try {
        sessions.push(JSON.parse(data[i][1]));
      } catch (e) {
        // skip invalid JSON
      }
    }
  }

  return { success: true, data: sessions };
}

function handleGetSession(sessionId) {
  var sheet = getOrCreateSheet('Sessions');
  var row = findRowByColumn(sheet, 1, sessionId);

  if (row <= 0) return { success: true, data: null };

  var json = sheet.getRange(row, 2).getValue();
  try {
    return { success: true, data: JSON.parse(json) };
  } catch (e) {
    return { success: true, data: null };
  }
}

function handleGetSessionByAccessCode(accessCode) {
  var sheet = getOrCreateSheet('Sessions');
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, data: null };

  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

  for (var i = 0; i < data.length; i++) {
    if (data[i][1]) {
      try {
        var session = JSON.parse(data[i][1]);
        if (session.accessCode === accessCode) {
          return { success: true, data: session };
        }
      } catch (e) {
        // skip
      }
    }
  }

  return { success: true, data: null };
}

// ============ GAME STATE MANAGEMENT ============

function handleUpdateGameState(data) {
  var sheet = getOrCreateSheet('GameState');
  ensureHeaders(sheet, ['SessionId', 'StateJSON', 'LastUpdated']);

  var row = findRowByColumn(sheet, 1, data.sessionId);

  if (row > 0) {
    // 기존 상태에 merge
    if (data.merge) {
      var existingJson = sheet.getRange(row, 2).getValue();
      try {
        var existing = JSON.parse(existingJson);
        var updates = JSON.parse(data.stateJson);
        var merged = mergeDeep(existing, updates);
        sheet.getRange(row, 2).setValue(JSON.stringify(merged));
      } catch (e) {
        sheet.getRange(row, 2).setValue(data.stateJson);
      }
    } else {
      sheet.getRange(row, 2).setValue(data.stateJson);
    }
    sheet.getRange(row, 3).setValue(new Date().toISOString());
  } else {
    sheet.appendRow([
      data.sessionId,
      data.stateJson,
      new Date().toISOString()
    ]);
  }

  return { success: true };
}

function handleGetGameState(sessionId) {
  var sheet = getOrCreateSheet('GameState');
  var row = findRowByColumn(sheet, 1, sessionId);

  if (row <= 0) return { success: true, data: null };

  var json = sheet.getRange(row, 2).getValue();
  try {
    return { success: true, data: JSON.parse(json) };
  } catch (e) {
    return { success: true, data: null };
  }
}

// ============ TURN LOG ============

function handleAppendTurnLog(data) {
  var sheet = getOrCreateSheet('TurnLog');
  ensureHeaders(sheet, [
    'Timestamp', 'SessionId', 'SessionName',
    'TeamName', 'TurnNumber', 'Position',
    'CardTitle', 'Situation',
    'ChoiceText', 'Reasoning',
    'AIFeedback', 'ScoreChange'
  ]);

  sheet.appendRow([
    new Date().toISOString(),
    data.sessionId || '',
    data.sessionName || '',
    data.teamName || '',
    data.turnNumber || 0,
    data.position || 0,
    data.cardTitle || '',
    data.situation || '',
    data.choiceText || '',
    data.reasoning || '',
    data.aiFeedback || '',
    data.scoreChange || ''
  ]);

  return { success: true };
}

// ============ HELPERS ============

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders(sheet, headers) {
  var firstRow = sheet.getRange(1, 1, 1, Math.min(headers.length, sheet.getMaxColumns())).getValues()[0];
  if (firstRow[0] === '' || firstRow[0] === null) {
    if (sheet.getMaxColumns() < headers.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function findRowByColumn(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  var data = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] == value) {
      return i + 2; // 1-indexed + header
    }
  }
  return -1;
}

function mergeDeep(target, source) {
  var result = {};
  // Copy target
  for (var key in target) {
    result[key] = target[key];
  }
  // Merge source
  for (var key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])
        && target[key] !== null && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      result[key] = mergeDeep(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
