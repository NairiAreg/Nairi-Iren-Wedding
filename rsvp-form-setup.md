# Setting Up Google Apps Script for RSVP Form

Follow these steps to connect your RSVP form to Google Sheets:

## 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Wedding RSVP Responses" or something similar
4. In cell A1, create the following headers (left to right):
   - Timestamp
   - Name
   - Email
   - Phone
   - Guests
   - Attendance
   - Message

## 2. Create the Google Apps Script

1. In your Google Sheet, click on **Extensions** > **Apps Script**
2. This will open the Apps Script editor in a new tab
3. Replace any existing code with this:

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // Get the active sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Sheet1"); // Use your sheet name here

    // Prepare the data row
    const row = [
      data.timestamp,
      data.name,
      data.email,
      data.phone,
      data.guests,
      data.attendance,
      data.message,
    ];

    // Append the data to the sheet
    sheet.appendRow(row);

    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Log the error
    console.error("Error: " + error);

    // Return error response
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", error: error })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. Deploy the Web App

1. In the Apps Script editor, click on **Deploy** > **New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Fill in the following:
   - Description: "Wedding RSVP Form Handler"
   - Execute as: "Me" (your Google account)
   - Who has access: "Anyone"
4. Click **Deploy**
5. Copy the Web App URL provided in the deployment popup

## 4. Update Your Website

1. Open your website code
2. Find the `myscripts.js` file
3. Locate this line (around line 352):
   ```javascript
   const scriptURL =
     "https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec";
   ```
4. Replace `YOUR_DEPLOYED_SCRIPT_ID` with the deployed web app URL you copied in step 3.5

## 5. Test the Form

1. Open your wedding website
2. Fill out the RSVP form and submit
3. Check your Google Sheet - a new row should appear with the submitted data

## Troubleshooting

- If form submissions aren't appearing in your spreadsheet, check the browser console for errors
- Make sure you've set the correct permissions in the Apps Script deployment
- Ensure the column headers in your spreadsheet match the order of data in the Apps Script code
