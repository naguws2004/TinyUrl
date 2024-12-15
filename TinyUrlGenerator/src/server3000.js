const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const validUrl = require('valid-url'); 
const { generateShortStrings, getTinyUrl, generatedStrings } = require('./utils/helper');
const db = require('./db');

class Server3000 {
    constructor(port) {
        this.app = express();
        this.port = port || 3000;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSwagger();
    }

    setupMiddleware() {
        this.app.use(express.json());
    }

    setupRoutes() {
        /**
         * @swagger
         * /urls:
         *   post:
         *     summary: Splits a comma-separated string of URLs and returns them as a dictionary
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               urls:
         *                 type: string
         *                 example: "http://example.com,http://example.org"
         *     responses:
         *       200:
         *         description: A dictionary of URLs
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               additionalProperties:
         *                 type: string
         *       400:
         *         description: No URLs provided
         */
        this.app.post('/urls', (req, res) => {
            try {
                const { urls } = req.body;
                if (!urls) {
                    return res.status(400).send('No URLs provided');
                }
                const urlArray = urls.split(',');
                const urlDict = {};
                urlArray.forEach((url, index) => {
                    const valid = validUrl.isUri(url.trim());
                    const tinyUrl = valid ? getTinyUrl(url.trim()) : '';

                    urlDict[index] = {
                        index: index + 1,
                        url: url.trim(),
                        valid: valid,
                        tinyUrl: tinyUrl
                    };
                    
                    if (valid) {
                        // Insert into MySQL
                        db.query('INSERT INTO url_mappings (original_url, tiny_url) VALUES (?, ?)', [url.trim(), tinyUrl], (err, results) => {
                            if (err) {
                                console.error('Error inserting into MySQL:', err);
                                throw err;
                            }
                        });
                    }
                });
                // Log the generated tiny URLs
                console.log(generatedStrings);
                res.json(Object.values(urlDict));
            } catch (error) {
                console.error('Error processing URLs:', error);
                res.status(500).send('An error occurred while processing the URLs');
            }
        });
        
        /**
         * @swagger
         * /urls:
         *   get:
         *     summary: Retrieves all URL mappings
         *     responses:
         *       200:
         *         description: A list of URL mappings
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   id:
         *                     type: integer
         *                   original_url:
         *                     type: string
         *                   tiny_url:
         *                     type: string
         *                   valid:
         *                     type: boolean
         *       500:
         *         description: An error occurred while fetching the URLs
         */
        this.app.get('/urls', (req, res) => {
            db.query('SELECT * FROM url_mappings', (err, results) => {
                if (err) {
                    console.error('Error fetching from MySQL:', err);
                    return res.status(500).send('An error occurred while fetching the URLs');
                }
                res.json(results);
            });
        });
/**
         * @swagger
         * /urls/{tinyUrl}:
         *   get:
         *     summary: Retrieves a URL mapping by tiny URL
         *     parameters:
         *       - in: path
         *         name: tinyUrl
         *         required: true
         *         schema:
         *           type: string
         *         description: The tiny URL to retrieve
         *     responses:
         *       200:
         *         description: URL mapping retrieved successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 id:
         *                   type: integer
         *                 original_url:
         *                   type: string
         *                 tiny_url:
         *                   type: string
         *                 valid:
         *                   type: boolean
         *       404:
         *         description: URL mapping not found
         *       500:
         *         description: An error occurred while retrieving the URL
         */
        this.app.get('/urls/:tinyUrl', (req, res) => {
            const { tinyUrl } = req.params;
            db.query('SELECT * FROM url_mappings WHERE tiny_url = ?', [tinyUrl], (err, results) => {
                if (err) {
                    console.error('Error fetching from MySQL:', err);
                    return res.status(500).send('An error occurred while retrieving the URL');
                }
                if (results.length === 0) {
                    return res.status(404).send('URL mapping not found');
                }
                res.json(results[0]);
            });
        });

        /**
         * @swagger
         * /urls/{tinyUrl}:
         *   delete:
         *     summary: Deletes a URL mapping by tiny URL
         *     parameters:
         *       - in: path
         *         name: tinyUrl
         *         required: true
         *         schema:
         *           type: string
         *         description: The tiny URL to delete
         *     responses:
         *       200:
         *         description: URL deleted successfully
         *       500:
         *         description: An error occurred while deleting the URL
         */
        this.app.delete('/urls/:tinyUrl', (req, res) => {
            const { tinyUrl } = req.params;
            db.query('DELETE FROM url_mappings WHERE tiny_url = ?', [tinyUrl], (err, results) => {
                if (err) {
                    console.error('Error deleting from MySQL:', err);
                    return res.status(500).send('An error occurred while deleting the URL');
                }
                res.send('URL deleted successfully');
            });
        });
    }

    setupSwagger() {
        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'Tiny URL Generator API',
                    version: '1.0.0',
                },
            },
            apis: ['./src/server3000.js'], // Path to the API docs
        };

        const specs = swaggerJsdoc(options);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    }

    start() {
        // Generate tiny URLs and store them in the in-memory store
        generateShortStrings();

        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
            // Log the generated tiny URLs
            console.log(generatedStrings);
        });
    }
}

module.exports = Server3000;