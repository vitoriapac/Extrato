import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
createServer(async(request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    let file=resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+sep))throw new Error('Caminho invalido');
    if((await stat(file)).isDirectory())file=resolve(file,'extrato-de-estudos-melhorado.html');
    response.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
    createReadStream(file).pipe(response);
  }catch(error){response.writeHead(404);response.end('Nao encontrado');}
}).listen(port,'127.0.0.1',()=>console.log(`StudyTrack em http://127.0.0.1:${port}`));
