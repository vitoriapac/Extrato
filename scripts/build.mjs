import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundles = [
  { entry: 'src/app.ts', output: 'src/app.bundle.js' },
  { entry: 'src/landing.tsx', output: 'src/landing.bundle.js' },
  { entry: 'src/domain/exams/exam-catalog-runtime.ts', output: 'src/exam-catalog.bundle.js' },
  { entry: 'src/reports/report-runtime.ts', output: 'src/report.bundle.js' },
  { entry: 'src/ui/help/help-runtime.ts', output: 'src/help.bundle.js' },
  { entry: 'src/demo/demo-runtime.ts', output: 'src/demo.bundle.js' },
];
const checkOnly = process.argv.includes('--check');
const versionPlaceholder = '__BUILD_VERSION__';
const assetVersionPattern =
  /((?:styles\/app\.css|styles\/tailwind\.css|src\/(?:app|landing)\.bundle\.js)\?v=)[^"'\s]+/g;

async function filesUnder(directory) {
  const absoluteDirectory = resolve(projectRoot, directory),
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async entry => {
      const path = relative(projectRoot, resolve(absoluteDirectory, entry.name)).replaceAll(
        '\\',
        '/'
      );
      return entry.isDirectory() ? filesUnder(path) : [path];
    })
  );
  return nested.flat();
}

const indexPath = resolve(projectRoot, 'index.html');
const indexSource = await readFile(indexPath, 'utf8');
const normalizedIndex = indexSource
  // As linhas de modulepreload são geradas a cada build (ver abaixo); não entram na versão.
  .replace(/[ \t]*<link rel="modulepreload" href="src\/chunks\/[^"]+">\r?\n/g, '')
  .replace(assetVersionPattern, `$1${versionPlaceholder}`)
  .replace(
    /<link rel="icon"[^>]*>/,
    '<link rel="icon" type="image/svg+xml" href="icons/app-icon.svg">'
  )
  .replace(
    /(<button class="(?:statement-title|compact-brand) brand-home"[^>]*>)(?:<img[^>]*>)?Extrato de Estudos/g,
    '$1<img src="icons/app-icon.svg" alt="" width="28" height="28">Extrato de Estudos'
  );
const landingSource = await readFile(resolve(projectRoot, 'landing.html'), 'utf8');
const normalizedLanding = landingSource
  .replace(assetVersionPattern, `$1${versionPlaceholder}`)
  .replace(/\s*<link rel="icon"[^>]*>/, '')
  .replace(
    '  <meta name="color-scheme"',
    '  <link rel="icon" type="image/svg+xml" href="/icons/app-icon.svg">\n  <meta name="color-scheme"'
  );
// O app é ESM com divisão de código: os pedaços compartilhados e os carregados sob demanda
// saem com hash no nome em src/chunks/ (gerados, fora da versão e do lint).
const chunkDir = 'src/chunks';
const sourceFiles = [
  ...(await filesUnder('src')).filter(
    path =>
      /\.(?:js|ts|tsx)$/.test(path) &&
      !bundles.some(bundle => bundle.output === path) &&
      !path.startsWith(`${chunkDir}/`)
  ),
  ...(await filesUnder('styles')).filter(
    path => path.endsWith('.css') && path !== 'styles/tailwind.css'
  ),
  ...(await filesUnder('icons')),
  ...(await filesUnder('fonts')),
  'index.html',
  'landing.html',
  'manifest.webmanifest',
  'package.json',
  'package-lock.json',
  'scripts/build.mjs',
  'service-worker.template.js',
].sort();
const versionHash = createHash('sha256');
for (const path of sourceFiles) {
  const isTextFile = /\.(?:css|html|js|ts|tsx|json|mjs|svg|webmanifest)$/i.test(path);
  const contents =
    path === 'index.html' || path === 'landing.html'
      ? path === 'index.html'
        ? normalizedIndex
        : normalizedLanding
      : await readFile(resolve(projectRoot, path), isTextFile ? 'utf8' : undefined);
  const stableContents = typeof contents === 'string' ? contents.replace(/\r\n/g, '\n') : contents;
  versionHash.update(path).update('\0').update(stableContents).update('\0');
}
const buildVersion = versionHash.digest('hex').slice(0, 12);
const generatedIndex = normalizedIndex.replaceAll(versionPlaceholder, buildVersion);
const serviceWorkerTemplate = await readFile(
  resolve(projectRoot, 'service-worker.template.js'),
  'utf8'
);

let stale = false;
async function writeOrCheck(output, generated) {
  const outputFile = resolve(projectRoot, output);
  const stableGenerated = generated.replace(/\r\n/g, '\n').trim() + '\n';
  if (checkOnly) {
    const current = await readFile(outputFile, 'utf8').catch(() => null);
    const normalizedCurrent = current ? current.replace(/\r\n/g, '\n').trim() + '\n' : null;
    if (normalizedCurrent !== stableGenerated) {
      console.error(`${output} esta desatualizado. Execute npm run build.`);
      if (normalizedCurrent) {
        console.error(
          `build-check: Diferenca detectada em ${output}: atual=${normalizedCurrent.length}B, gerado=${stableGenerated.length}B`
        );
        for (let i = 0; i < Math.max(normalizedCurrent.length, stableGenerated.length); i++) {
          if (normalizedCurrent[i] !== stableGenerated[i]) {
            console.error(`build-check: Primeiro caractere diferente no indice ${i}:`);
            console.error(
              `  Atual:  ${JSON.stringify(normalizedCurrent.slice(Math.max(0, i - 15), i + 35))}`
            );
            console.error(
              `  Gerado: ${JSON.stringify(stableGenerated.slice(Math.max(0, i - 15), i + 35))}`
            );
            break;
          }
        }
      }
      stale = true;
    } else console.log(`${output} atualizado e reproduzivel.`);
  } else {
    await mkdir(dirname(outputFile), { recursive: true });
    await writeFile(outputFile, stableGenerated, 'utf8');
    console.log(`Arquivo atualizado: ${outputFile}`);
  }
}

const tailwindCli = resolve(projectRoot, 'node_modules/@tailwindcss/cli/dist/index.mjs');
const tailwindInput = resolve(projectRoot, 'styles/tailwind.input.css');

let generatedTailwind;
try {
  generatedTailwind = execFileSync(
    process.execPath,
    [tailwindCli, '-i', tailwindInput, '--minify'],
    { cwd: projectRoot, encoding: 'utf8' }
  );
} catch (error) {
  console.error('Erro ao compilar Tailwind CSS:', error.message);
  process.exit(1);
}
await writeOrCheck('styles/tailwind.css', generatedTailwind);

const chunkFiles = [];
const startupChunks = [];
for (const bundle of bundles) {
  const isApp = bundle.output === 'src/app.bundle.js';
  const result = await build({
    entryPoints: [resolve(projectRoot, bundle.entry)],
    bundle: true,
    write: false,
    format: isApp ? 'esm' : 'iife',
    ...(isApp
      ? {
          splitting: true,
          outdir: resolve(projectRoot, 'src'),
          entryNames: 'app.bundle',
          chunkNames: 'chunks/[name]-[hash]',
        }
      : {}),
    platform: 'browser',
    target: ['es2020'],
    charset: 'utf8',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    legalComments: 'none',
    minify: true,
    metafile: isApp,
    define: { __STUDYTRACK_BUILD_VERSION__: JSON.stringify(buildVersion) },
    banner: { js: '/* Arquivo gerado. Edite os modulos em src/, nao este bundle. */' },
  });
  if (!isApp) {
    await writeOrCheck(bundle.output, result.outputFiles[0].text);
    continue;
  }
  for (const file of result.outputFiles) {
    const output = relative(projectRoot, file.path).replaceAll('\\', '/');
    if (output.startsWith(`${chunkDir}/`)) chunkFiles.push(output);
    await writeOrCheck(output, file.text);
  }
  // Pedaços que a abertura importa de forma estática: pré-carregados em paralelo, sem cascata.
  const outputs = result.metafile.outputs;
  const toPath = key => relative(projectRoot, resolve(projectRoot, key)).replaceAll('\\', '/');
  const startup = new Set();
  const walk = key => {
    for (const dependency of outputs[key].imports) {
      if (dependency.kind !== 'import-statement' || startup.has(dependency.path)) continue;
      startup.add(dependency.path);
      walk(dependency.path);
    }
  };
  walk(Object.keys(outputs).find(key => outputs[key].entryPoint));
  startupChunks.push(...[...startup].map(toPath).sort());
}
// Pedaços de builds anteriores (hash antigo) saem: só fica o que este build gerou.
const existingChunks = await filesUnder(chunkDir).catch(() => []);
for (const old of existingChunks.filter(path => !chunkFiles.includes(path))) {
  if (checkOnly) {
    console.error(`${old} sobrou de um build anterior. Execute npm run build.`);
    stale = true;
  } else {
    await rm(resolve(projectRoot, old));
    console.log(`Pedaço antigo removido: ${old}`);
  }
}
const generatedServiceWorker = serviceWorkerTemplate
  .replaceAll(versionPlaceholder, buildVersion)
  .replace(
    /  '__APP_CHUNKS__',\r?\n/,
    chunkFiles
      .sort()
      .map(path => `  './${path}',\n`)
      .join('')
  );
const appScriptTag = /([ \t]*)<script type="module" src="src\/app\.bundle\.js\?v=/;
const indentation = generatedIndex.match(appScriptTag)?.[1] ?? '  ';
await writeOrCheck(
  'index.html',
  generatedIndex.replace(
    appScriptTag,
    startupChunks.map(path => `${indentation}<link rel="modulepreload" href="${path}">\n`).join('') +
      `${indentation}<script type="module" src="src/app.bundle.js?v=`
  )
);
await writeOrCheck('landing.html', normalizedLanding.replaceAll(versionPlaceholder, buildVersion));
await writeOrCheck('service-worker.js', generatedServiceWorker);
if (stale) process.exitCode = 1;
