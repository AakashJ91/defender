const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon'
};

const webDir = path.join(__dirname, 'web');

function requestHandler(req, res) {
    let cleanUrl = req.url.split('?')[0];
    if (cleanUrl === '/' || cleanUrl === '') {
        cleanUrl = '/index.html';
    }

    const safePath = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(webDir, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // NO CACHE HEADERS so user browser ALWAYS gets latest files immediately
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*'
        });

        fs.createReadStream(filePath).pipe(res);
    });
}

function startServer(port) {
    const server = http.createServer(requestHandler);
    server.listen(port, () => {
        console.log(`Defender Dev Server listening on http://localhost:${port}`);
    });
    server.on('error', (e) => {
        console.warn(`Server port ${port} error:`, e.message);
    });
    return server;
}

// Start on BOTH 8080 and 8090
startServer(8080);
startServer(8090);
