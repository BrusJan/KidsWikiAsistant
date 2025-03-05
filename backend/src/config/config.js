require('dotenv').config();

const config = {
    MISTRAL_API_URL: 'https://api.mistral.ai/v1/chat/completions',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
};

module.exports = config;