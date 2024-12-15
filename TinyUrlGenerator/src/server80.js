const express = require('express');
const db = require('./db');

class Server80 {
    constructor(port) {
        this.app = express();
        this.port = port || 80;
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
    }

    setupRoutes() {
        // Route handler for redirecting based on the tiny URL ID
        // This route will handle requests to the domain tinyweb.io and redirect to the original URL
        // after displaying a countdown timer for 5 seconds.
        this.app.get('/:id', (req, res) => {
            const { id } = req.params;
            const domain = req.headers.host;
            const tinyUrl = `http://${domain}/${id}`;
            console.log(`Tiny Url: ${tinyUrl}`);
            db.query('SELECT original_url, hits FROM url_mappings WHERE tiny_url = ?', [tinyUrl], (err, results) => {
                if (err) {
                    console.error('Error fetching from MySQL:', err);
                    return res.status(500).send('An error occurred while retrieving the URL');
                }
                if (results.length === 0) {
                    return res.status(404).send('URL mapping not found');
                }
                const originalUrl = results[0].original_url;
                const hits = results[0].hits;
                console.log(`Redirecting to: ${originalUrl} in 5 seconds`);
                console.log(`Number of hits till previous redirection: ${hits}`);

                // Increment the hits by 1
                db.query('UPDATE url_mappings SET hits = hits + 1 WHERE tiny_url = ?', [tinyUrl], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating hits in MySQL:', updateErr);
                    }
                });

                res.send(`
                    <html>
                        <head>
                            <meta http-equiv="refresh" content="5;url=${originalUrl}" />
                            <script>
                                let countdown = 5;
                                function updateCountdown() {
                                    document.getElementById('countdown').innerText = countdown;
                                    countdown--;
                                    if (countdown >= 0) {
                                        setTimeout(updateCountdown, 1000);
                                    }
                                }
                                window.onload = updateCountdown;
                            </script>
                        </head>
                        <body>
                            <p>Redirecting to <a href="${originalUrl}">${originalUrl}</a> in <span id="countdown">5</span> seconds...</p>
                            <p>Number of hits till previous redirection: ${hits}</p>
                        </body>
                    </html>
                `);
            });
        });
    }

    start() {
        // Listen on port 80
        this.app.listen(80, () => {
            console.log(`Server is running on http://localhost:80`);
        });
    }
}

module.exports = Server80;