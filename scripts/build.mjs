import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputFile = resolve(projectRoot, 'src/app.bundle.js');
const checkOnly = process.argv.includes('--check');
const result = await build({
  entryPoints: [resolve(projectRoot, 'src/app.js')], bundle: true, write: false,
  format: 'iife', platform: 'browser', target: ['es2020'], charset: 'utf8',
  legalComments: 'none', banner: {js: '/* Arquivo gerado. Edite os modulos em src/, nao este bundle. */'}
});
const generated = result.outputFiles[0].text;
if (checkOnly) {
  const current = await readFile(outputFile, 'utf8').catch(() => '');
  if (current !== generated) {
    console.error('src/app.bundle.js esta desatualizado. Execute npm run build.');
    process.exitCode = 1;
  } else console.log('Bundle atualizado e reproduzivel.');
} else {
  await writeFile(outputFile, generated, 'utf8');
  console.log(`Bundle atualizado: ${outputFile}`);
}
