# Google Sheets Attendance Setup

## Overview
This guide explains how to add the attendance tracking functionality to your Google Apps Script.

## Setup

### Step 1: Create Attendance Sheet

1. Open your Google Sheet (the one with users)
2. Click the **+** icon at the bottom to add a new sheet
3. Name it `Attendance`
4. Add headers in row 1:
   - **A:** userName
   - **B:** type
   - **C:** time
   - **D:** address
   - **E:** latitude
   - **F:** longitude
   - **G:** device
   - **H:** id

### Step 2: Update Google Apps Script

1. Go back to your Apps Script (Tools → Script editor)
2. Add these functions to your existing code:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === "getUsers") {
      return getUsers(sheet);
    } else if (data.action === "addUser") {
      return addUser(sheet, data.user);
    } else if (data.action === "addAttendance") {
      return addAttendance(data.attendance);
    } else if (data.action === "getUserAttendance") {
      return getUserAttendance(data.userName);
    }
  } catch (error) {
    return createResponse({ error: error.message });
  }
}

function doOptions(e) {
  return createResponse({});
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getUsers(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  const users = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[0]) {
      users.push({
        email: row[0],
        password: row[1],
        name: row[2],
        phone: row[3],
        role: row[4],
        createdAt: row[5],
      });
    }
  }

  return createResponse({ users: users });
}

function addUser(sheet, user) {
  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0]?.toLowerCase() === user.email.toLowerCase()) {
      throw new Error("Email already exists");
    }
  }

  sheet.appendRow([
    user.email,
    user.password,
    user.name,
    user.phone,
    user.role,
    user.createdAt,
  ]);

  return createResponse({ success: true });
}

// ========== ATTENDANCE FUNCTIONS ==========

function addAttendance(attendanceRecord) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let attendanceSheet = spreadsheet.getSheetByName("Attendance");
  
  // Create sheet if it doesn't exist
  if (!attendanceSheet) {
    attendanceSheet = spreadsheet.insertSheet("Attendance");
    attendanceSheet.appendRow([
      "userName", "type", "time", "address", "latitude", "longitude", "device", "id"
    ]);
  }

  attendanceSheet.appendRow([
    attendanceRecord.userName,
    attendanceRecord.type,
    attendanceRecord.time,
    attendanceRecord.address || "",
    attendanceRecord.lat || "",
    attendanceRecord.lng || "",
    attendanceRecord.device || "",
    attendanceRecord.id || "",
  ]);

  return createResponse({ success: true });
}

function getUserAttendance(userName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const attendanceSheet = spreadsheet.getSheetByName("Attendance");
  
  if (!attendanceSheet) {
    return createResponse({ records: [] });
  }

  const range = attendanceSheet.getDataRange();
  const values = range.getValues();
  const records = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[0]?.toLowerCase() === userName?.toLowerCase()) {
      records.push({
        userName: row[0],
        type: row[1],
        time: row[2],
        address: row[3],
        lat: row[4],
        lng: row[5],
        device: row[6],
        id: row[7],
      });
    }
  }

  return createResponse({ records: records });
}
```

3. Save the script (Ctrl+S)
4. Deploy as NEW deployment (don't update old one)
5. Get the new deployment URL and update `.env.local` if needed

## Testing

1. Go to http://localhost:5175/employee/login
2. Login with a test account
3. Click **Check-in** - should record check-in with timestamp
4. Click **Check-out** - should record check-out with timestamp
5. Check your Google Sheet "Attendance" tab - should see new rows

## Data Recorded

Each attendance record includes:
- **userName** - Name of the employee
- **type** - "checkin" or "checkout"
- **time** - ISO timestamp (e.g., 2024-01-21T10:30:45.123Z)
- **address** - Location address (if available)
- **latitude** - GPS latitude
- **longitude** - GPS longitude
- **device** - Device information
- **id** - Unique record ID
