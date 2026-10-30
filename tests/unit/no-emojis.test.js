import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Regex que captura emojis Unicode e pictografias estendidas
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

function scanFiles(dir, predicate) {
  let matched = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      matched = matched.concat(scanFiles(full, predicate));
    } else if (entry.isFile() && predicate(entry.name)) {
      matched.push(full);
    }
  }
  return matched;
}

test('Governança Zero Emojis — index.html não deve conter emojis Unicode', () => {
  const content = fs.readFileSync('index.html', 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    if (EMOJI_REGEX.test(line)) {
      violations.push({ line: index + 1, text: line.trim() });
    }
  });

  assert.equal(
    violations.length,
    0,
    `Encontrado(s) emoji(s) no index.html:\n${violations.map(v => `  L${v.line}: ${v.text}`).join('\n')}`
  );
});

test('Governança Zero Emojis — src/ (código-fonte) não deve conter emojis Unicode', () => {
  const sourceFiles = scanFiles('src', name =>
    /\.(ts|tsx|js|jsx|html|css)$/.test(name) && !name.endsWith('.bundle.js')
  );

  const allViolations = [];

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (EMOJI_REGEX.test(line)) {
        allViolations.push({
          file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }

  assert.equal(
    allViolations.length,
    0,
    `Encontrado(s) emoji(s) no código-fonte (src/):\n${allViolations
      .map(v => `  ${v.file}:${v.line} -> ${v.text}`)
      .join('\n')}`
  );
});
