const axios = require('axios');

const search = async (req, res) => {
  try {
    const { query } = req.query;
    
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
    console.error('Error searching Wikipedia:', error);
    res.status(500).json({
      title: 'Chyba služby',
      content: 'Služba Wikipedia je momentálně nedostupná. Zkus to prosím později.',
      url: ''
    });
  }
};

module.exports = {
  search
};