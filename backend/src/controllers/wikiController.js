const axios = require('axios');

const search = async (req, res) => {
  try {
    const { query } = req.query;
    
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

    if (!searchResponse.data.query.search.length) {
      return res.status(404).json({ error: 'No articles found' });
    }

    // Get first article title
    const firstArticle = searchResponse.data.query.search[0];
    
    // Second API call - get article content
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
    
    res.json({
      title: firstArticle.title,
      content: pages[pageId].extract,
      url: `https://cs.wikipedia.org/wiki/${encodeURIComponent(firstArticle.title)}`
    });

  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    res.status(500).json({ error: 'Failed to search Wikipedia' });
  }
};

module.exports = {
  search
};