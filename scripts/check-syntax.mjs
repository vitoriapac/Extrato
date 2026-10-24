import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { transformSync } from 'esbuild';

const roots = ['scripts', 'src', 'tests'];
const ignored = new Set(['node_modules', 'test-results', 'playwright-report']);
const files = [];
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (
      ['.js', '.mjs', '.ts', '.tsx'].includes(extname(entry.name)) &&
      !entry.name.endsWith('.bundle.js')
    )
      files.push(path);
  }
}
roots.forEach(collect);
files.push('playwright.config.js', 'playwright.gates.config.js');
for (const file of files) {
  const loader = file.endsWith('.tsx') ? 'tsx' : file.endsWith('.ts') ? 'ts' : 'js';
  try {
    transformSync(readFileSync(file, 'utf8'), { loader, sourcefile: file, logLevel: 'silent' });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
console.log(`Sintaxe válida em ${files.length} arquivos JavaScript/TypeScript.`);
