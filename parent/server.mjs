import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import httpProxy from 'http-proxy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARENT_PORT = Number(process.env.PARENT_PORT ?? 3000);
const STOCK_PORT = Number(process.env.STOCK_PORT ?? 3001);
const VF_PORT = Number(process.env.VF_PORT ?? 3002);

const indexHtml = fs.readFileSync(path.join(__dirname, 'public/index.html'));

const proxy = httpProxy.createProxyServer({ xfwd: true });

proxy.on('error', (_err, _req, res) => {
  if (res && 'writeHead' in res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Child dashboard is not ready yet.');
  }
});

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';

  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexHtml);
    return;
  }

  if (url === '/stock-autonomy' || url.startsWith('/stock-autonomy/')) {
    proxy.web(req, res, { target: `http://127.0.0.1:${STOCK_PORT}` });
    return;
  }

  if (url === '/virtual-flow' || url.startsWith('/virtual-flow/')) {
    proxy.web(req, res, { target: `http://127.0.0.1:${VF_PORT}` });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PARENT_PORT, '127.0.0.1', () => {
  console.log(`Parent dashboard: http://localhost:${PARENT_PORT}`);
});
