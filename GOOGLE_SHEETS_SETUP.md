# Google Sheets Authentication Setup Guide

## Overview
This project uses **Google Sheets** to manage user accounts and authentication. Users are stored in a Google Sheet and authenticated via email and password.

## Architecture

The authentication flow uses:
1. **Google Sheet** - Store user data (email, password, name, phone, role)
2. **Google Apps Script** - API endpoint to read/write sheet data (avoids CORS issues)
3. **axios** - HTTP client to call the Apps Script API

## Setup Steps

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ New** → **Spreadsheet**
3. Name it `TronxLabs Users`
4. Create columns with headers (row 1):
   - **A:** email
   - **B:** password
   - **C:** name
   - **D:** phone
   - **E:** role
   - **F:** createdAt

**Example initial data:**
```
email                password    name           phone        role    createdAt
ashoke@gmail.com    123456      Ashoke Kumar   9876543210   admin   2024-01-21T00:00:00.000Z
emp1@tronxlabs.com  test123     John Doe       9999999999   employee  2024-01-21T00:00:00.000Z
```

5. Copy the **Sheet ID** from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Save this for later

### Step 2: Create Google Apps Script Endpoint

1. Open your Google Sheet
2. Click **Tools** → **Script editor**
3. Delete any existing code
4. Paste this script (with proper CORS handling):

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === "getUsers") {
      return getUsers(sheet);
    } else if (data.action === "addUser") {
      return addUser(sheet, data.user);
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
    if (row[0]) { // if email exists
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
  // Check if email already exists
  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0]?.toLowerCase() === user.email.toLowerCase()) {
      throw new Error("Email already exists");
    }
  }

  // Add new row
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
```

5. Save the script (Ctrl+S)
6. Name it `Users API`

### Step 3: Deploy Google Apps Script

1. **IMPORTANT:** If you already deployed this script, you must create a **NEW deployment** (not update the old one)
   - Click **Deployments** (left sidebar)
   - Delete the old deployment if it exists
   - Then click **Deploy** → **New deployment**

2. Select type: **Web app**

3. Fill in:
   - **Execute as:** Your Google account
   - **Who has access:** Anyone

4. Click **Deploy**

5. Copy the deployment URL - it should look like:
   ```
   https://script.google.com/macros/s/AKfycbw.../exec
   ```

6. Replace `/exec` with `/usercontent` and add to `.env.local`:
   ```
   VITE_GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/AKfycbw.../usercontent
   ```

7. **Save and restart your dev server** (important!)

### Step 4: Configure Environment Variables

1. Open `.env.local` in the project root
2. Update with your values:

```
VITE_GOOGLE_SHEETS_API_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
VITE_GOOGLE_SHEETS_ID=your_sheet_id_here
```

### Step 5: Test the Setup

1. Run the project:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:5173/employee/signup`
3. Create an account with:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
4. Check your Google Sheet - the new row should appear
5. Login with the same credentials

## Security Notes

### ⚠️ Important: Passwords in Plain Text
Currently passwords are stored as plain text in Google Sheets. For production:

**Option 1: Use bcrypt hashing**
- Add hashing in the Apps Script before storing
- Verify hashed passwords on login

**Option 2: Add to Apps Script:**
```javascript
// Simple hash simulation (use proper bcrypt if available)
function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
}
```

### ⚠️ Google Sheet Security
- Set sheet to private
- Only share with trusted users
- Do NOT share the Apps Script deployment URL publicly
- Consider using Google Sheet API with Service Account for production

### Recommended Improvements
- Add password hashing before storing
- Add email verification
- Add rate limiting for login attempts
- Add 2FA support
- Use Google Sheets API instead of Apps Script for better control

## Sheet Format

| email | password | name | phone | role | createdAt |
|-------|----------|------|-------|------|-----------|
| user@example.com | pass123 | John Doe | 9876543210 | employee | 2024-01-21T00:00:00.000Z |
| admin@example.com | admin123 | Admin | - | admin | 2024-01-21T00:00:00.000Z |

## Troubleshooting

### CORS Error: "blocked by CORS policy"
**This is the most common issue.** The Google Apps Script deployment must be updated with the new code.

**Solution:**
1. Go back to your Google Apps Script
2. Make sure you have the **latest code** (with `doOptions` function)
3. **Delete the old deployment** (Deployments > trash icon)
4. Create a **NEW deployment** (not updating the old one - this is important!)
5. Update `.env.local` with the new deployment URL (change `/exec` to `/usercontent`)
6. Save and restart dev server: `npm run dev`

**If that still doesn't work:**
Try using `/dev` endpoint instead:
```
VITE_GOOGLE_SHEETS_API_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
```

Or test directly in your browser:
```
https://script.google.com/macros/s/{YOUR_ID}/usercontent
```
You should see JSON output if it's working.

### "Failed to fetch user data"
- Check that `VITE_GOOGLE_SHEETS_API_URL` is set in `.env.local`
- Verify the Apps Script has the `doOptions` function
- Check browser console (F12) → Network tab → check the request/response
- Make sure deployment is set to "Anyone" access

### "Email already exists" (on signup)
- The email is already in the Google Sheet
- Try a different email address

### Apps Script not returning data
- Make sure you deployed as "Anyone" access
- Check the Apps Script logs: **View** → **Execution log**
- Verify sheet headers are exactly: email, password, name, phone, role, createdAt

### New users not appearing in Sheet
- Check if the sheet is full or has formatting issues
- Manually verify the Apps Script can write by checking logs

## File Changes

- **New:** `src/services/googleSheets.js` - Google Sheets API integration
- **Modified:** `src/services/auth.js` - Uses Google Sheets instead of Firebase
- **Modified:** `src/services/storage.js` - Removed Firebase references
- **Modified:** `.env.local` - Google Sheets configuration
- **Deleted:** `src/services/firebase.js` - No longer needed

## Testing Credentials

Add these test users to your Google Sheet:

**Admin:**
- Email: ashoke@gmail.com
- Password: 123456
- Role: admin

**Employee:**
- Email: emp@tronxlabs.com
- Password: emp123
- Role: employee

## Resources
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Apps Script Service Reference](https://developers.google.com/apps-script/reference)
