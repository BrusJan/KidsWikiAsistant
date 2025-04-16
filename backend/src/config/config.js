require('dotenv').config();

const config = {
    MISTRAL_API_URL: 'https://api.mistral.ai/v1/chat/completions',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    REPORT_EMAIL: 'jb.fxtrade@gmail.com',
};

module.exports = config;