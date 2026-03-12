/**
 * Book a Call — Webhook untuk Google Sheets
 *
 * Cara setup:
 * 1. Buat Google Sheets BARU (terpisah dari sheet diagnostic)
 * 2. Extensions > Apps Script
 * 3. Hapus code default, paste seluruh code ini
 * 4. Deploy > New deployment > Web app
 * 5. Set "Who has access" ke "Anyone"
 * 6. Deploy, copy URL-nya
 * 7. Paste URL ke BOOK_CALL_WEBHOOK_URL di js/book-a-call-handler.js
 *
 * Kolom yang akan otomatis terbuat di sheet:
 * timestamp | nama | email | whatsapp | perusahaan | jabatan | topik | pesan
 */

// ============================================================
// doPost() — Terima data dari form Book a Call
// ============================================================
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Setup header kalau sheet masih kosong
    if (sheet.getLastRow() === 0) {
      var headers = Object.keys(data);
      headers.unshift("timestamp");
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Ambil header yang sudah ada
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Cek field baru yang belum ada di header
    var dataKeys = Object.keys(data);
    dataKeys.forEach(function(key) {
      if (headers.indexOf(key) === -1) {
        var newCol = headers.length + 1;
        sheet.getRange(1, newCol).setValue(key);
        headers.push(key);
      }
    });

    // Susun data sesuai urutan header
    var row = headers.map(function(header) {
      if (header === "timestamp") {
        return new Date().toLocaleString("id-ID");
      }
      return data[header] || "";
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Data berhasil disimpan"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// doGet() — Test endpoint
// ============================================================
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          count: 0,
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    var results = dataRange.map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) {
        obj[header] = row[i];
      });
      return obj;
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        count: results.length,
        data: results
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
