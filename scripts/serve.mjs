import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const projectRoot = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const production = process.argv.includes('--dist');
const root = production ? resolve(projectRoot, 'dist') : projectRoot;
const port = Number(process.env.PORT) || 4173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/app/') {
      response.writeHead(308, { Location: `/app${new URL(request.url, 'http://localhost').search}` });
      return response.end();
    }
    if (pathname === '/app') {
      response.setHeader('Content-Type', types['.html']);
      return createReadStream(resolve(root, production ? 'app.html' : 'index.html')).pipe(response);
    }
    let file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Caminho invalido');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(404);
    response.end('Nao encontrado');
  }
}).listen(port, '127.0.0.1', () => console.log(`StudyTrack em http://127.0.0.1:${port}`));
