const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.woff2': 'font/woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0];
    if (cleanUrl !== '/' && !path.extname(cleanUrl)) {
        cleanUrl += '.html';
    }
    let filePath = path.join(publicDir, cleanUrl === '/' ? 'home.html' : cleanUrl);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Service Worker must be served with no-cache headers and from root scope
    const headers = { 'Content-Type': contentType };
    if (cleanUrl === '/sw.js') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Service-Worker-Allowed'] = '/';
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`[PayVlt] Production features: Sentry, Offline, PostHog, AutoSave ✅`);
});
