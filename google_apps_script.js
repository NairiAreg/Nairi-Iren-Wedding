function doPost(e) {
  try {
    let data;

    // Check if the data is coming as form data with a payload parameter
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    }
    // Check if the data is coming as JSON in the postData
    else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    // Handle form-submitted parameters directly
    else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("No data received");
    }

    // Get the active sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Sheet1"); // Use your sheet name here

    // Prepare the data row with only the required fields in the desired order
    const row = [
      data.timestamp || new Date().toISOString(),
      data.name || "",
      data.phone || "",
      data.attendance || "",
    ];

    // Append the data to the sheet
    sheet.appendRow(row);

    // Set CORS headers for the response
    const response = {
      result: "success",
    };

    // Return success response with CORS headers
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT")
      .setHeader("Access-Control-Allow-Headers", "Content-Type");
  } catch (error) {
    // Log the error
    console.error("Error: " + error);

    // Return error response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "error",
        error: error.toString(),
      })
    )
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT")
      .setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

// Handle preflight CORS requests
function doOptions(e) {
  var output = ContentService.createTextOutput("");
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return output;
}
