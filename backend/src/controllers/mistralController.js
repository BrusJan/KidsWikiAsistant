const axios = require('axios');
const config = require('../config/config');

const getMistralResponse = async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = req.body.model || "google/gemma-3-27b-it:free"; // Default to Gemma 2 27B Instruct (free)

    const headers = {
      'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    };
    // Add recommended headers if configured
    if (config.OPENROUTER_SITE_URL) {
      headers['HTTP-Referer'] = config.OPENROUTER_SITE_URL;
    }
    if (config.OPENROUTER_SITE_NAME) {
      headers['X-Title'] = config.OPENROUTER_SITE_NAME;
    }

    const response = await axios.post(config.OPENROUTER_API_URL, {
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    }, {
      headers: headers
    });

    res.json(response.data);
  } catch (error) {
    console.error(`AI API error: ${error.message}`);
    res.status(error.response ? error.response.status : 500).json({ 
      error: 'Failed to get response from OpenRouter AI'
    });
  }
};

module.exports = {
  getMistralResponse
};