const SHEET_NAME = 'tips';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const tips = rows.slice(1).map((row, i) => ({
    id: i + 2,
    timestamp: row[0],
    title: row[1],
    body: row[2],
    tag: row[3],
    likes: row[4] || 0
  }));
  return ContentService
    .createTextOutput(JSON.stringify({ tips }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const VALID_TAGS = ['프롬프트작성', '디버깅', '코드리뷰', '워크플로우', '기타'];

  if (data.action === 'submit') {
    const title = String(data.title || '').trim().slice(0, 20);
    const body = String(data.body || '').trim().slice(0, 200);
    const tag = VALID_TAGS.includes(data.tag) ? data.tag : '기타';
    if (!title || !body) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'title and body are required' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheet.appendRow([new Date(), title, body, tag, 0]);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (data.action === 'like') {
    const row = data.id;
    const likesCell = sheet.getRange(row, 5);
    likesCell.setValue((likesCell.getValue() || 0) + 1);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: 'unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}
