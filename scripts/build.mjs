import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundles = [
  {entry: 'src/app.js', output: 'src/app.bundle.js'},
  {entry: 'src/domain/exams/exam-catalog-runtime.js', output: 'src/exam-catalog.bundle.js'}
];
const checkOnly = process.argv.includes('--check');
const versionPlaceholder = '__BUILD_VERSION__';
const assetVersionPattern = /((?:styles\/app\.css|src\/app\.bundle\.js)\?v=)[^"'\s]+/g;

async function filesUnder(directory){
  const absoluteDirectory=resolve(projectRoot,directory),entries=await readdir(absoluteDirectory,{withFileTypes:true});
  const nested=await Promise.all(entries.map(async entry=>{
    const path=relative(projectRoot,resolve(absoluteDirectory,entry.name)).replaceAll('\\','/');
    return entry.isDirectory()?filesUnder(path):[path];
  }));
  return nested.flat();
}

const indexPath=resolve(projectRoot,'index.html');
const indexSource=await readFile(indexPath,'utf8');
const normalizedIndex=indexSource.replace(assetVersionPattern,`$1${versionPlaceholder}`);
const sourceFiles=[
  ...(await filesUnder('src')).filter(path=>path.endsWith('.js')&&!bundles.some(bundle=>bundle.output===path)),
  ...(await filesUnder('styles')).filter(path=>path.endsWith('.css')),
  ...(await filesUnder('icons')),
  'index.html','manifest.webmanifest','package.json','package-lock.json','scripts/build.mjs','service-worker.template.js'
].sort();
const versionHash=createHash('sha256');
for(const path of sourceFiles){
  const isTextFile=/\.(?:css|html|js|json|mjs|svg|webmanifest)$/i.test(path);
  const contents=path==='index.html'?normalizedIndex:await readFile(resolve(projectRoot,path),isTextFile?'utf8':undefined);
  const stableContents=typeof contents==='string'?contents.replace(/\r\n/g,'\n'):contents;
  versionHash.update(path).update('\0').update(stableContents).update('\0');
}
const buildVersion=versionHash.digest('hex').slice(0,12);
const generatedIndex=normalizedIndex.replaceAll(versionPlaceholder,buildVersion);
const serviceWorkerTemplate=await readFile(resolve(projectRoot,'service-worker.template.js'),'utf8');
const generatedServiceWorker=serviceWorkerTemplate.replaceAll(versionPlaceholder,buildVersion);

let stale = false;
async function writeOrCheck(output,generated){
  const outputFile=resolve(projectRoot,output);
  if(checkOnly){
    const current=await readFile(outputFile,'utf8').catch(()=>null);
    if(current!==generated){
      console.error(`${output} esta desatualizado. Execute npm run build.`);
      stale=true;
    }else console.log(`${output} atualizado e reproduzivel.`);
  }else{
    await writeFile(outputFile,generated,'utf8');
    console.log(`Arquivo atualizado: ${outputFile}`);
  }
}

for(const bundle of bundles){
  const result=await build({
    entryPoints:[resolve(projectRoot,bundle.entry)],bundle:true,write:false,
    format:'iife',platform:'browser',target:['es2020'],charset:'utf8',
    legalComments:'none',minify:true,
    define:{__STUDYTRACK_BUILD_VERSION__:JSON.stringify(buildVersion)},
    banner:{js:'/* Arquivo gerado. Edite os modulos em src/, nao este bundle. */'}
  });
  await writeOrCheck(bundle.output,result.outputFiles[0].text);
}
await writeOrCheck('index.html',generatedIndex);
await writeOrCheck('service-worker.js',generatedServiceWorker);
if(stale)process.exitCode=1;
