const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS
  }
});

const submitReport = async (req, res) => {
  try {
    const { responseId, query, text } = req.body;

    const mailOptions = {
      from: config.EMAIL_USER,
      to: config.REPORT_EMAIL,
      subject: `Wiki Assistant Report - Response ${responseId}`,
      text: `Report Details:
Query: ${query}
Response ID: ${responseId}
Issue Description: ${text}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error(`Report submission failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

module.exports = {
  submitReport
};