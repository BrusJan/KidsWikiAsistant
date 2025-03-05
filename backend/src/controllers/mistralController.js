const axios = require('axios');
const config = require('../config/config');

const getMistralResponse = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const response = await axios.post(config.MISTRAL_API_URL, {
      model: "mistral-large-latest",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${config.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    res.status(500).json({ error: 'Failed to get response from Mistral' });
  }
};

module.exports = {
  getMistralResponse
};