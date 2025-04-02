const wikiController = require('./wikiController');
const mistralController = require('./mistralController');

const getKidsFriendlySummary = async (req, res) => {
    try {
        // Create mock request/response for wikiController
        const wikiReq = { query: { query: req.query.query } };
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
        console.log('Wiki Response:', wikiRes.data); // Debug log

        if (!wikiRes.data || !wikiRes.data.content) {
            console.log('No wiki content found, falling back to Mistral AI'); // Debug log
            
            // Create direct prompt for Mistral when no wiki article found
            const mistralReq = {
                body: {
                    prompt: `Napiš krátký odstavec tak aby to pochopilo šestileté dítě na toto téma: ${req.query.query}`
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
            
            return res.json({
                originalTitle: req.query.query,
                kidsFriendlySummary: "Nenašel jsem odpověď na wikipedii tak to zkusím sám: " + 
                                   mistralRes.data.choices[0].message.content,
                wikiUrl: ''
            });
        }

        // Create prompt for Mistral
        const mistralReq = {
            body: {
                prompt: `Vytvoř krátký odstavec nebo větu s použitím těchto faktů tak aby text pochopilo šestileté dítě: ${wikiRes.data.content}`
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
        console.log('Mistral Response:', mistralRes.data); // Debug log

        // Return the combined result
        res.json({
            originalTitle: wikiRes.data.title,
            kidsFriendlySummary: mistralRes.data.choices[0].message.content,
            wikiUrl: wikiRes.data.url
        });

    } catch (error) {
        console.error('Error in getKidsFriendlySummary:', error);
        res.status(500).json({ error: 'Failed to generate kid-friendly summary' });
    }
};

module.exports = {
    getKidsFriendlySummary
};