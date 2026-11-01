import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

// check:bundle only verifies the bundles are up to date; this prints their real size.
const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const format = bytes => bytes.toLocaleString('pt-BR');

const rows = readdirSync(srcDir)
  .filter(name => name.endsWith('.bundle.js'))
  .sort()
  .map(name => {
    const content = readFileSync(resolve(srcDir, name));
    return { name, bytes: content.length, gzip: gzipSync(content).length };
  });

const width = Math.max(...rows.map(row => row.name.length));
for (const row of rows) {
  console.log(`${row.name.padEnd(width)}  ${format(row.bytes).padStart(11)} bytes  ${format(row.gzip).padStart(9)} gzip`);
}
const total = rows.reduce((sum, row) => sum + row.bytes, 0);
const totalGzip = rows.reduce((sum, row) => sum + row.gzip, 0);
console.log(`${'total'.padEnd(width)}  ${format(total).padStart(11)} bytes  ${format(totalGzip).padStart(9)} gzip`);
