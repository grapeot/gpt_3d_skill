import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(fileURLToPath(new URL('../../dist/', import.meta.url)));
const prefix = '/example/viewer';
const port = 5196;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { send(res, 400, 'invalid path'); return; }
  if (pathname === prefix) {
    res.writeHead(302, { location: `${prefix}/` });
    res.end();
    return;
  }
  if (!pathname.startsWith(`${prefix}/`)) {
    send(res, 404, 'not found');
    return;
  }
  let rel = pathname.slice(prefix.length);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.resolve(dist, `.${rel}`);
  const relative = path.relative(dist, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    send(res, 403, 'forbidden');
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, 'not found');
      return;
    }
    send(res, 200, data, mime[path.extname(filePath)] || 'application/octet-stream');
  });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`nested static server http://127.0.0.1:${port}${prefix}/\n`);
});
