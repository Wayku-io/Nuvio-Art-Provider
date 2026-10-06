const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const posterHandler = require('./api/poster.js');

const PORT = 3333;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. API route: /api/poster or /poster/:id
  if (pathname === '/api/poster' || pathname.startsWith('/poster/')) {
    // Adapter for Vercel req/res
    req.query = parsedUrl.query;
    if (pathname.startsWith('/poster/')) {
      const parts = pathname.replace('/poster/', '').split('/');
      if (parts.length === 2) {
        req.query.type = parts[0];
        req.query.id = parts[1];
      } else {
        req.query.id = parts[0];
      }
    }

    // Enhance res with Vercel helper methods if not present
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.send = function(data) {
      if (typeof data === 'string') {
        this.end(data);
      } else {
        this.end(data);
      }
      return this;
    };

    try {
      await posterHandler(req, res);
    } catch (err) {
      console.error('Serverless handler error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: ' + err.message);
    }
    return;
  }

  // 2. Static files
  let filePath = path.join(__dirname, pathname === '/' ? 'preview.html' : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'preview.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Unified Art Provider server running on http://localhost:${PORT}`);
});
