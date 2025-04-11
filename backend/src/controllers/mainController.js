const wikiController = require('./wikiController');
const mistralController = require('./mistralController');
const config = require('../config/config');

const getKidsFriendlySummary = async (req, res) => {
    try {
        // Create mock request/response for wikiController
        const wikiReq = { 
          query: { 
            query: req.query.query,
            userId: req.query.userId
          }
        };
        
        console.log('Received request with:', {
          query: req.query.query,
          userId: req.query.userId
        });

        const wikiRes = {
            json: function(data) {
                this.data = data;
                return data;
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            data: null,
            statusCode: 200
        };

        // Get Wikipedia article and properly handle response
        await wikiController.search(wikiReq, wikiRes);
        console.log('Wiki Response:', wikiRes.data);

        // Check if there's an error code from Wiki controller
        if (wikiRes.data && wikiRes.data.errorCode) {
            // Just pass the error code to the frontend
            return res.status(wikiRes.statusCode).json(wikiRes.data);
        }

        if (!wikiRes.data || !wikiRes.data.content) {
            console.log('No wiki content found, falling back to Mistral AI');
            
            // Create language-appropriate prompt for Mistral
            let mistralPrompt;
            if (config.LANGUAGE === 'cs') {
                mistralPrompt = `Napiš krátký odstavec tak aby to pochopilo šestileté dítě na toto téma: ${req.query.query}`;
            } else {
                mistralPrompt = `Write a short paragraph that a six-year-old child could understand about this topic: ${req.query.query}`;
            }
            
            // Create direct prompt for Mistral when no wiki article found
            const mistralReq = {
                body: {
                    prompt: mistralPrompt
                }
            };
            const mistralRes = {
                json: function(data) {
                    this.data = data;
                    return data;
                },
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                data: null,
                statusCode: 200
            };

            await mistralController.getMistralResponse(mistralReq, mistralRes);
            
            // Create language-appropriate prefix message
            const prefix = config.LANGUAGE === 'cs' 
                ? "Nenašel jsem odpověď na wikipedii tak to zkusím sám: "
                : "I couldn't find an answer on Wikipedia, so I'll try myself: ";
            
            return res.json({
                originalTitle: req.query.query,
                kidsFriendlySummary: prefix + mistralRes.data.choices[0].message.content,
                wikiUrl: ''
            });
        }

        // Create language-appropriate prompt for Mistral
        let mistralPrompt;
        if (config.LANGUAGE === 'cs') {
            mistralPrompt = `Vytvoř krátký odstavec nebo větu s použitím těchto faktů tak aby text pochopilo šestileté dítě: ${wikiRes.data.content}`;
        } else {
            mistralPrompt = `Create a short paragraph or sentence using these facts in a way a six-year-old child would understand: ${wikiRes.data.content}`;
        }
        
        const mistralReq = {
            body: {
                prompt: mistralPrompt
            }
        };
        const mistralRes = {
            json: function(data) {
                this.data = data;
                return data;
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            data: null,
            statusCode: 200
        };

        // Get Mistral response
        await mistralController.getMistralResponse(mistralReq, mistralRes);
        console.log('Mistral Response:', mistralRes.data);

        // Return the combined result
        res.json({
            originalTitle: wikiRes.data.title,
            kidsFriendlySummary: mistralRes.data.choices[0].message.content,
            wikiUrl: wikiRes.data.url
        });

    } catch (error) {
        console.error('Error in getKidsFriendlySummary:', error);
        res.status(500).json({ 
            errorCode: 'ERROR_SUMMARY_GENERATION_FAILED'
        });
    }
};

module.exports = {
    getKidsFriendlySummary
};