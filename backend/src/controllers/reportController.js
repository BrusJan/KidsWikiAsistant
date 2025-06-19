const firebaseAdmin = require('../config/firebase');

// Create a reference to the Firestore database
const db = firebaseAdmin.firestore();

const submitReport = async (req, res) => {
  // Respond immediately to avoid timeout
  res.json({ message: 'Report received. Processing in background.' });

  try {
    const { responseId, query, text, responseText, userEmail } = req.body;
    console.log(`Processing report for response: ${responseId}, from user: ${userEmail || 'N/A'}`);

    // Create the report document in Firestore
    const reportData = {
      responseId,
      query,
      description: text,
      responseText: responseText || 'N/A',
      reporterEmail: userEmail || 'anonymous@user.com',
      status: 'new', // Initial status
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore in background
    saveReportToFirestore(reportData);
  } catch (error) {
    console.error(`Report background processing failed: ${error.message}`);
    // We don't send an error response since we already responded to the client
  }
};

// Separate function to handle Firestore saving in the background
async function saveReportToFirestore(reportData) {
  try {
    // Add report to the 'reports' collection
    const reportRef = await db.collection('reports').add(reportData);
    console.log(`Report saved to Firestore with ID: ${reportRef.id}`);
  } catch (error) {
    console.error(`Firestore save failed: ${error.message}`);
    
    // Log failed reports
    try {
      console.log(`Failed report details: ${JSON.stringify(reportData)}`);
    } catch (logError) {
      console.error(`Failed to log report details: ${logError.message}`);
    }
  }
}

module.exports = {
  submitReport
};