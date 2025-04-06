const axios = require('axios');
const firebaseAdmin = require('../config/firebase');

const search = async (req, res) => {
  const { query, userId } = req.query;

  try {
    if (!userId) {
      return res.status(401).json({
        title: 'Chyba přístupu',
        content: 'Pro tuto akci musíte být přihlášen.',
        url: ''
      });
    }

    // Check user's subscription status
    const userDoc = await firebaseAdmin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        title: 'Chyba přístupu',
        content: 'Uživatel nenalezen.',
        url: ''
      });
    }

    const userData = userDoc.data();
    
    // If user is not premium, check API calls
    if (userData.subscriptionStatus !== 'premium') {
      if (userData.apiCallsUsed >= userData.apiCallsLimit) {
        return res.status(403).json({
          title: 'Limit vyčerpán',
          content: 'Dosáhli jste maximálního počtu dotazů. Pro pokračování si prosím aktivujte předplatné.',
          url: ''
        });
      }
      
      // Increment API calls counter
      await firebaseAdmin.firestore().collection('users').doc(userId).update({
        apiCallsUsed: (userData.apiCallsUsed || 0) + 1
      });
    }
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        title: 'Chyba vyhledávání',
        content: 'Nezadal jsi žádný dotaz k vyhledání.',
        url: ''
      });
    }
    
    // First API call - search for articles
    const searchResponse = await axios.get(`https://cs.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        origin: '*',
        language: 'cs'
      }
    });

    // If search was successful, increment the total search counter
    if (searchResponse.data && searchResponse.data.query) {
      await firebaseAdmin.firestore().collection('users').doc(userId).update({
        totalSearchQueries: firebaseAdmin.firestore.FieldValue.increment(1)
      });
    }

    if (!searchResponse.data.query.search.length) {
      return res.status(404).json({
        title: 'Článek nenalezen',
        content: `Bohužel jsem nenašel žádný článek o "${query}". Zkus to prosím s jiným dotazem.`,
        url: ''
      });
    }

    // Get first article title
    const firstArticle = searchResponse.data.query.search[0];
    
    try {
      const contentResponse = await axios.get(`https://cs.wikipedia.org/w/api.php`, {
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
          title: firstArticle.title,
          content: 'Bohužel se nepodařilo načíst obsah článku. Zkus to prosím znovu.',
          url: ''
        });
      }

      res.json({
        title: firstArticle.title,
        content: pages[pageId].extract,
        url: `https://cs.wikipedia.org/wiki/${encodeURIComponent(firstArticle.title)}`
      });

    } catch (contentError) {
      console.error('Error fetching article content:', contentError);
      res.status(500).json({
        title: firstArticle.title,
        content: 'Při načítání článku došlo k chybě. Zkus to prosím později.',
        url: ''
      });
    }

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      title: 'Chyba vyhledávání',
      content: 'Nepodařilo se najít požadované informace.',
      url: ''
    });
  }
};

module.exports = {
  search
};