import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tablerNodesPath = resolve(
  projectRoot,
  'node_modules/@tabler/icons/tabler-nodes-outline.json'
);
const outputPath = resolve(projectRoot, 'src/ui/primitives/tabler-icons-data.ts');

const iconList = [
  'search',
  'download',
  'upload',
  'cloud',
  'file-text',
  'file-description',
  'file-search',
  'player-play',
  'player-pause',
  'check',
  'x',
  'chevron-down',
  'chevron-right',
  'chevron-up',
  'chevron-left',
  'calendar',
  'clock',
  'target',
  'sparkles',
  'settings',
  'trash',
  'help',
  'link',
  'alert-triangle',
  'alert-circle',
  'compass',
  'contrast',
  'book',
  'brain',
  'calculator',
  'dice',
  'bolt',
  'flame',
  'trophy',
  'cards',
  'clipboard-text',
  'bookmark',
  'video',
  'scale',
  'thumb-up',
  'thumb-down',
  'star',
  'trending-up',
  'trending-down',
  'lock',
  'refresh',
  'circle-check',
  'circle-x',
  'circle-dot',
  'crystal-ball',
  'rocket',
  'info-circle',
  'sun',
  'moon',
  'dots',
  'copy',
  'pencil',
  'history',
  'chart-bar',
  'chart-pie',
  'award',
  'bulb',
  'confetti',
  'pin',
  'maximize',
  'flag',
  'folders',
  'folder',
  'calendar-event',
  'circle',
];

const rawData = await readFile(tablerNodesPath, 'utf8');
const allNodes = JSON.parse(rawData);

const iconMap = {};
for (const name of iconList) {
  if (!allNodes[name]) {
    throw new Error(`Ícone do Tabler Icons não encontrado: ${name}`);
  }
  iconMap[name] = allNodes[name];
}

const aliases = {
  play: 'player-play',
  pause: 'player-pause',
  close: 'x',
  gear: 'settings',
  alert: 'alert-triangle',
  report: 'file-text',
  timer: 'clock',
  up: 'trending-up',
  down: 'trending-down',
};

for (const [alias, target] of Object.entries(aliases)) {
  if (iconMap[target]) {
    iconMap[alias] = iconMap[target];
  }
}

const tsContent = `// Arquivo gerado automaticamente a partir de @tabler/icons (MIT License).
// Edite scripts/generate-tabler-icons.mjs para adicionar novos ícones do Tabler Icons.

export type TablerNode = [string, Record<string, string>];

export const TABLER_ICONS_DATA: Record<string, TablerNode[]> = ${JSON.stringify(iconMap, null, 2)};
`;

await writeFile(outputPath, tsContent, 'utf8');
console.log(`Gerado com sucesso: ${outputPath} (${Object.keys(iconMap).length} ícones Tabler)`);
