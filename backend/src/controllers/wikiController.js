const axios = require('axios');
const admin = require('../config/firebase');
const { AuthController } = require('../controllers/authController');
const { FieldValue } = require('firebase-admin/firestore');
const config = require('../config/config');

const search = async (req, res) => {
  const { query, userId, language } = req.query;

  try {
    // Validate and get language (default to config if not provided)
    const lang = isValidLanguage(language) ? language : config.LANGUAGE;

    if (!userId) {
      return res.status(401).json({
        errorCode: 'ERROR_NOT_AUTHENTICATED',
        url: ''
      });
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        errorCode: 'ERROR_USER_NOT_FOUND',
        url: ''
      });
    }

    const userData = userDoc.data();
    const subscriptionStatus = await AuthController.checkSubscriptionStatus(userData.stripeCustomerId);
    
    if (subscriptionStatus.subscription === 'free') {
      if ((userData.apiCallsUsed || 0) >= (userData.apiCallsLimit || 10)) {
        return res.status(403).json({
          errorCode: 'ERROR_LIMIT_EXCEEDED',
          url: ''
        });
      }
      
      // Use FieldValue.increment() for atomic updates
      await userRef.update({
        apiCallsUsed: FieldValue.increment(1),
        totalSearchQueries: FieldValue.increment(1)
      });
    } else {
      // For premium users, just increment total queries
      await userRef.update({
        totalSearchQueries: FieldValue.increment(1)
      });
    }

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        errorCode: 'ERROR_EMPTY_QUERY',
        url: ''
      });
    }
    
    // Get Wikipedia API URL based on the language parameter
    const wikipediaApiUrl = `https://${lang}.wikipedia.org/w/api.php`;
    
    // First API call - search for articles
    const searchResponse = await axios.get(wikipediaApiUrl, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*',
        language: lang
      }
    });

    if (!searchResponse.data.query.search.length) {
      return res.status(404).json({
        errorCode: 'ERROR_ARTICLE_NOT_FOUND',
        query: query, // Pass query for interpolation in translation
        url: ''
      });
    }

    // Get first article title
    const firstArticle = searchResponse.data.query.search[0];
    
    try {
      const contentResponse = await axios.get(wikipediaApiUrl, {
        params: {
          action: 'query',
          prop: 'extracts',
          exintro: true,
          explaintext: true,
          titles: firstArticle.title,
          format: 'json',
          origin: '*'
        }
      });

      const pages = contentResponse.data.query.pages;
      const pageId = Object.keys(pages)[0];
      
      if (!pages[pageId].extract) {
        return res.status(404).json({
          errorCode: 'ERROR_NO_CONTENT',
          title: firstArticle.title,
          url: ''
        });
      }

      // Use language-specific Wikipedia URL for article link
      res.json({
        title: firstArticle.title,
        content: pages[pageId].extract,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(firstArticle.title)}`,
        language: lang // Include the language in the response
      });

    } catch (contentError) {
      console.error('Error fetching article content:', contentError);
      res.status(500).json({
        errorCode: 'ERROR_CONTENT_FETCH_FAILED',
        title: firstArticle.title,
        url: ''
      });
    }

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      errorCode: 'ERROR_SEARCH_FAILED',
      url: ''
    });
  } 
};

// Helper function to validate language code
function isValidLanguage(lang) {
  // List of supported language codes
  const supportedLanguages = ['cs', 'en', 'es', 'de', 'fr', 'it', 'ru', 'ja', 'zh', 'pl'];
  return typeof lang === 'string' && supportedLanguages.includes(lang.toLowerCase());
}

module.exports = {
  search
};