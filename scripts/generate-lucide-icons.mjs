import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lucideNodesPath = resolve(projectRoot, 'node_modules/lucide-static/icon-nodes.json');
const outputPath = resolve(projectRoot, 'src/ui/primitives/lucide-icons-data.ts');

/**
 * Mapa de nomes semânticos do aplicativo -> nomes canônicos em Lucide (`lucide-static/icon-nodes.json`).
 * Preserva os nomes usados pelos componentes e controladores atuais enquanto incorpora também os nomes canônicos do Lucide.
 */
/** @type {Record<string, string>} */
const iconMapping = {
  // Core UI & ações
  search: 'search',
  download: 'download',
  upload: 'upload',
  cloud: 'cloud',
  'file-text': 'file-text',
  'file-description': 'scroll-text',
  'file-search': 'file-search',
  'player-play': 'play',
  'player-pause': 'pause',
  check: 'check',
  x: 'x',
  'chevron-down': 'chevron-down',
  'chevron-right': 'chevron-right',
  'chevron-up': 'chevron-up',
  'chevron-left': 'chevron-left',
  calendar: 'calendar',
  clock: 'clock',
  target: 'target',
  sparkles: 'sparkles',
  settings: 'settings',
  trash: 'trash',
  help: 'badge-question-mark',
  link: 'link',
  'alert-triangle': 'triangle-exclamation-point',
  'alert-circle': 'circle-exclamation-point',
  compass: 'compass',
  contrast: 'contrast',
  book: 'book',
  brain: 'brain',
  calculator: 'calculator',
  dice: 'dice-5',
  bolt: 'zap',
  flame: 'flame',
  trophy: 'trophy',
  cards: 'square-stack',
  'clipboard-text': 'clipboard-list',
  bookmark: 'bookmark',
  video: 'video',
  scale: 'scale',
  'thumb-up': 'thumbs-up',
  'thumb-down': 'thumbs-down',
  star: 'star',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',
  lock: 'lock',
  refresh: 'refresh-cw',
  'circle-check': 'circle-check',
  'circle-x': 'circle-x',
  'circle-dot': 'circle-dot',
  'crystal-ball': 'wand-sparkles',
  rocket: 'rocket',
  'info-circle': 'info',
  sun: 'sun',
  moon: 'moon',
  dots: 'ellipsis',
  copy: 'copy',
  pencil: 'pencil',
  history: 'rotate-ccw-clock',
  'chart-bar': 'chart-bar',
  'chart-pie': 'chart-pie',
  award: 'award',
  bulb: 'lightbulb',
  confetti: 'party-popper',
  pin: 'pin',
  maximize: 'maximize',
  flag: 'flag',
  folders: 'folders',
  folder: 'folder',
  'calendar-event': 'calendar-range',
  circle: 'circle',
  // Navegação, cronômetro, ações, dados, demo, alertas e estados
  'layout-dashboard': 'layout-dashboard',
  'chart-line': 'chart-line',
  books: 'library',
  'calendar-month': 'calendar-days',
  repeat: 'repeat',
  'list-check': 'list-check',
  'map-2': 'map',
  'help-circle': 'circle-question-mark',
  gauge: 'gauge',
  progress: 'loader',
  'loader-2': 'loader-circle',
  'list-details': 'layout-list',
  'arrow-right': 'arrow-right',
  'square-check': 'square-check',
  'focus-2': 'focus',
  'picture-in-picture': 'picture-in-picture-2',
  plus: 'plus',
  'file-import': 'file-input',
  'file-export': 'file-output',
  'file-type-pdf': 'file-chart-column',
  'cloud-upload': 'cloud-upload',
  'cloud-download': 'cloud-download',
  database: 'database',
  filter: 'funnel',
  flask: 'flask-conical',
  route: 'route',
  logout: 'log-out',
  'building-bank': 'landmark',
  'device-laptop': 'laptop',
  language: 'languages',
  'circle-dashed': 'circle-dashed',
  'arrows-shuffle': 'shuffle',
  'arrow-back-up': 'undo-2',
  'baseline-density-medium': 'rows-2',
  'baseline-density-small': 'rows-3',
  minus: 'minus',
  // Autenticação, Usuário, Sessões e Avatar
  user: 'user',
  'user-circle': 'circle-user',
  users: 'users',
  login: 'log-in',
  devices: 'monitor-smartphone',
  shield: 'shield',
  'shield-check': 'shield-check',
  crown: 'crown',
  'external-link': 'external-link',
  'dots-vertical': 'ellipsis-vertical',
  photo: 'image',
  'credit-card': 'credit-card',
  // Sincronização em Nuvem
  'cloud-check': 'cloud-check',
  'cloud-off': 'cloud-off',
  // Acolhimento e Empatia
  'heart-handshake': 'heart-handshake',
  // Ícones semânticos adicionais
  adjustments: 'sliders-horizontal',
  'calendar-plus': 'calendar-plus',
  'calendar-time': 'calendar-clock',
  certificate: 'certificate',
  'chart-dots': 'chart-scatter',
  'shield-alert': 'shield-exclamation-point',
  'sun-moon': 'sun-moon',
  'sun-low': 'sunset',
  // Atalhos semânticos & nomes canônicos Lucide
  play: 'play',
  pause: 'pause',
  close: 'x',
  gear: 'settings',
  alert: 'triangle-exclamation-point',
  report: 'file-text',
  timer: 'clock',
  up: 'trending-up',
  down: 'trending-down',
  zap: 'zap',
  'triangle-alert': 'triangle-exclamation-point',
  'circle-alert': 'circle-exclamation-point',
  ellipsis: 'ellipsis',
  'ellipsis-vertical': 'ellipsis-vertical',
  'sliders-horizontal': 'sliders-horizontal',
  funnel: 'funnel',
  'refresh-cw': 'refresh-cw',
  landmark: 'landmark',
  library: 'library',
  focus: 'focus',
  lightbulb: 'lightbulb',
  'loader-circle': 'loader-circle',
  'flask-conical': 'flask-conical',
  'log-out': 'log-out',
  'log-in': 'log-in',
};

const rawData = await readFile(lucideNodesPath, 'utf8');
const allNodes = JSON.parse(rawData);

const iconMap = {};
for (const [name, lucideKey] of Object.entries(iconMapping)) {
  const nodes = allNodes[lucideKey];
  if (!nodes) {
    throw new Error(`Ícone do Lucide não encontrado em icon-nodes.json: ${name} -> ${lucideKey}`);
  }
  iconMap[name] = nodes;
}

const tsContent = `// Arquivo gerado automaticamente a partir de lucide-static (ISC License).
// Edite scripts/generate-lucide-icons.mjs para adicionar novos ícones do Lucide Icons.

export type LucideNode = [string, Record<string, string>];

export const LUCIDE_ICONS_DATA: Record<string, LucideNode[]> = ${JSON.stringify(iconMap, null, 2)};
`;

await writeFile(outputPath, tsContent, 'utf8');
console.log(`Gerado com sucesso: ${outputPath} (${Object.keys(iconMap).length} entradas Lucide)`);
