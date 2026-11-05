import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = resolve(projectRoot, 'dist');
const skipCompile = process.argv.includes('--skip-compile');

const ROOT_FILES = ['index.html', 'manifest.webmanifest', 'service-worker.js'];

const SRC_RUNTIME_FILES = [
  'src/theme-bootstrap.js',
  'src/pwa.js',
  'src/app.bundle.js',
  'src/exam-catalog.bundle.js',
  'src/report.bundle.js',
  'src/help.bundle.js',
  'src/demo.bundle.js',
];

const STYLE_FILES = [
  'styles/tokens.css',
  'styles/fonts.css',
  'styles/tailwind.css',
  'styles/app.css',
  'styles/print.css',
];

const STATIC_DIRECTORIES = ['icons', 'fonts'];

const CLOUDFLARE_HEADERS = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/src/*.bundle.js
  Cache-Control: public, max-age=31536000, immutable

/styles/*.css
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/service-worker.js
  Cache-Control: no-cache, no-store, must-revalidate
`;

async function collectFilesRecursively(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectFilesRecursively(fullPath)));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

export async function buildProductionDist({
  rootDir = projectRoot,
  outDir = distRoot,
  compile = !skipCompile,
} = {}) {
  if (compile) {
    execFileSync(process.execPath, [resolve(rootDir, 'scripts/build.mjs')], {
      cwd: rootDir,
      stdio: 'inherit',
    });
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(resolve(outDir, 'src'), { recursive: true });
  await mkdir(resolve(outDir, 'styles'), { recursive: true });

  for (const relPath of [...ROOT_FILES, ...SRC_RUNTIME_FILES, ...STYLE_FILES]) {
    const srcPath = resolve(rootDir, relPath);
    const destPath = resolve(outDir, relPath);
    await cp(srcPath, destPath);
  }

  for (const dirName of STATIC_DIRECTORIES) {
    const srcDir = resolve(rootDir, dirName);
    const destDir = resolve(outDir, dirName);
    await cp(srcDir, destDir, { recursive: true });
  }

  await writeFile(resolve(outDir, '.nojekyll'), '', 'utf8');
  await writeFile(resolve(outDir, '_headers'), CLOUDFLARE_HEADERS, 'utf8');

  const packagedFiles = await collectFilesRecursively(outDir);
  const leakedSourceFiles = packagedFiles.filter(filePath =>
    ['.ts', '.tsx', '.map'].includes(extname(filePath).toLowerCase())
  );

  if (leakedSourceFiles.length > 0) {
    throw new Error(
      `Falha de segurança no empacotamento: arquivos de código-fonte detectados em dist/: ${leakedSourceFiles.join(', ')}`
    );
  }

  let totalBytes = 0;
  for (const filePath of packagedFiles) {
    const fileStat = await stat(filePath);
    totalBytes += fileStat.size;
  }

  return {
    outDir,
    fileCount: packagedFiles.length,
    totalBytes,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const summary = await buildProductionDist();
  const sizeMb = (summary.totalBytes / (1024 * 1024)).toFixed(2);
  console.log(
    `Pacote de produção fechado gerado em ${summary.outDir} (${summary.fileCount} arquivos, ${sizeMb} MB, zero arquivos .ts/.tsx expostos).`
  );
}
