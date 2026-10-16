// Servidor estático mínimo para rodar o jogo: node server.js → http://localhost:5173
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 5173;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.tmj': 'application/json', '.mjs': 'text/javascript', '.ogg': 'audio/ogg','.wav': 'audio/wav', '.mp3': 'audio/mpeg' };

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Garibaldo rodando em http://localhost:${PORT}`));
