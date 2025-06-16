const wikiController = require('./wikiController');
const mistralController = require('./mistralController');
const config = require('../config/config');

const getKidsFriendlySummary = async (req, res) => {
    try {
        // Get the language from the request or use default
        const language = req.query.language || config.LANGUAGE;
        
        // Create mock request/response for wikiController
        const wikiReq = { 
          query: { 
            query: req.query.query,
            userId: req.query.userId,
            language: language 
          }
        };
        
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

        // Check if there's an error code from Wiki controller
        if (wikiRes.data && wikiRes.data.errorCode) {
            // Just pass the error code to the frontend
            return res.status(wikiRes.statusCode).json(wikiRes.data);
        }

        if (!wikiRes.data || !wikiRes.data.content) {
            console.log(`No wiki content found for: ${req.query.query}, using AI fallback`);
            
            // For now, we'll still use config.LANGUAGE for Mistral prompts
            // This will be updated in a future implementation
            let mistralPrompt;
            if (language === 'cs') {
                mistralPrompt = `Napiš krátký odstavec tak aby to pochopilo šestileté dítě na toto téma: ${req.query.query}`;
            } else if (language === 'es') {
                mistralPrompt = `Escribe un párrafo corto que un niño de seis años pueda entender sobre este tema: ${req.query.query}`;
            } else if (language === 'de') {
                mistralPrompt = `Schreibe einen kurzen Absatz, den ein sechsjähriges Kind über dieses Thema verstehen kann: ${req.query.query}`;
            } else if (language === 'fr') {
                mistralPrompt = `Écris un court paragraphe qu'un enfant de six ans pourrait comprendre sur ce sujet : ${req.query.query}`;
            } else if (language === 'it') {
                mistralPrompt = `Scrivi un breve paragrafo che un bambino di sei anni possa comprendere su questo argomento: ${req.query.query}`;
            } else if (language === 'pl') {
                mistralPrompt = `Napisz krótki akapit na ten temat, który zrozumie sześcioletnie dziecko: ${req.query.query}`;
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
            let prefix;
            if (language === 'cs') {
                prefix = "Nenašel jsem odpověď na wikipedii tak to zkusím sám: ";
            } else if (language === 'es') {
                prefix = "No pude encontrar una respuesta en Wikipedia, así que lo intentaré yo mismo: ";
            } else if (language === 'de') {
                prefix = "Ich konnte keine Antwort auf Wikipedia finden, also versuche ich es selbst: ";
            } else if (language === 'fr') {
                prefix = "Je n'ai pas trouvé de réponse sur Wikipédia, donc je vais essayer moi-même : ";
            } else if (language === 'it') {
                prefix = "Non ho trovato una risposta su Wikipedia, quindi ci provo io stesso: ";
            } else if (language === 'pl') {
                prefix = "Nie znalazłem odpowiedzi w Wikipedii, więc spróbuję sam: ";
            } else {
                prefix = "I couldn't find an answer on Wikipedia, so I'll try myself: ";
            }
            
            return res.json({
                originalTitle: req.query.query,
                kidsFriendlySummary: prefix + mistralRes.data.choices[0].message.content,
                wikiUrl: '',
                language: language // Include the language in the response
            });
        }

        // Create language-appropriate prompt for Mistral
        let mistralPrompt;
        if (language === 'cs') {
            mistralPrompt = `Vytvoř krátký odstavec nebo větu s použitím těchto faktů tak aby text pochopilo šestileté dítě: ${wikiRes.data.content}`;
        } else if (language === 'es') {
            mistralPrompt = `Crea un párrafo corto o una frase utilizando estos hechos de una manera que un niño de seis años pueda entender: ${wikiRes.data.content}`;
        } else if (language === 'de') {
            mistralPrompt = `Erstelle einen kurzen Absatz oder Satz mit diesen Fakten auf eine Weise, die ein sechsjähriges Kind verstehen würde: ${wikiRes.data.content}`;
        } else if (language === 'fr') {
            mistralPrompt = `Crée un court paragraphe ou une phrase en utilisant ces faits d'une manière qu'un enfant de six ans pourrait comprendre : ${wikiRes.data.content}`;
        } else if (language === 'it') {
            mistralPrompt = `Crea un breve paragrafo o una frase utilizzando questi fatti in modo che un bambino di sei anni possa capire: ${wikiRes.data.content}`;
        } else if (language === 'pl') {
            mistralPrompt = `Stwórz krótki akapit lub zdanie wykorzystując te fakty w sposób, który zrozumie sześcioletnie dziecko: ${wikiRes.data.content}`;
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

        // Return the combined result
        res.json({
            originalTitle: wikiRes.data.title,
            kidsFriendlySummary: mistralRes.data.choices[0].message.content,
            wikiUrl: wikiRes.data.url,
            language: language // Include the language in the response
        });

    } catch (error) {
        console.error(`Summary generation failed for "${req.query.query}": ${error.message}`);
        res.status(500).json({ 
            errorCode: 'summary_generation_failed'
        });
    }
};

module.exports = {
    getKidsFriendlySummary
};