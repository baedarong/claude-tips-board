// gas/Code.gs
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
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (data.action === 'submit') {
    sheet.appendRow([
      new Date(),
      data.title,
      data.body,
      data.tag,
      0
    ]);
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
