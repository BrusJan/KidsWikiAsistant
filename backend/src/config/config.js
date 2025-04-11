require('dotenv').config();

const config = {
    MISTRAL_API_URL: 'https://api.mistral.ai/v1/chat/completions',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    REPORT_EMAIL: 'jb.fxtrade@gmail.com',
    // Add language configuration with fallback to Czech
    LANGUAGE: process.env.LANGUAGE || 'cs',
    
    // Helper function to get language-specific Wikipedia URLs
    getWikipediaUrl: function() {
        return `https://${this.LANGUAGE}.wikipedia.org/w/api.php`;
    }
};

module.exports = config;