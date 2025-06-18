const nodemailer = require('nodemailer');
const config = require('../config/config');

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'prod';

// Configure transporter with appropriate options for development vs production
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS
  },
  // Add this for local development to bypass certificate validation
  ...(isDevelopment && {
    tls: {
      rejectUnauthorized: false
    }
  })
});

const submitReport = async (req, res) => {
  try {
    const { responseId, query, text, responseText } = req.body;

    const mailOptions = {
      from: 'no-reply@vikitorek.com',
      to: config.SUPPORT_EMAIL,
      subject: `Wiki Assistant Report - Response ${responseId}`,
      text: `Report Details:
Query: ${query}
Response ID: ${responseId}
Issue Description: ${text}
Response Text: ${responseText || 'N/A'}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Report submitted for response: ${responseId}`);
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error(`Report submission failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

module.exports = {
  submitReport
};