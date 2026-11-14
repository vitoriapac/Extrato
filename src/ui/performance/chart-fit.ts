/**
 * Gráficos de Desempenho na largura do cartão, sem rolagem lateral.
 *
 * Cada SVG guarda a sua geometria num viewBox fixo. Em vez de impor uma largura mínima (e rolar no celular),
 * o gráfico ocupa 100% do cartão e o texto mantém o tamanho em px: `--fit` é a escala renderizada
 * (largura ÷ viewBox) e o CSS divide o tamanho da fonte por ela (`.chart-fit text`).
 */
let observer: ResizeObserver | null = null;

const MIN_VIEWBOX_WIDTH = 250;

function isFittable(svg: SVGSVGElement): boolean {
  const box = svg.viewBox?.baseVal;
  if (!box || box.width < MIN_VIEWBOX_WIDTH) return false;
  // Ícones e donut (viewBox menor que o mínimo) e barras que esticam (preserveAspectRatio="none") ficam como estão.
  if (svg.getAttribute('preserveAspectRatio') === 'none') return false;
  return svg.dataset.fit !== 'off';
}

function applyScale(svg: SVGSVGElement): void {
  const box = svg.viewBox.baseVal;
  const width = svg.getBoundingClientRect().width;
  if (!width || !box.width) return;
  svg.style.setProperty('--fit', (width / box.width).toFixed(3));
}

export function fitCharts(root: ParentNode | null | undefined): void {
  if (!root || typeof ResizeObserver === 'undefined') return;
  observer?.disconnect();
  observer ??= new ResizeObserver(entries => {
    for (const entry of entries) applyScale(entry.target as SVGSVGElement);
  });
  root.querySelectorAll('svg').forEach(node => {
    const svg = node as SVGSVGElement;
    if (!isFittable(svg)) return;
    svg.classList.add('chart-fit');
    applyScale(svg);
    observer!.observe(svg);
  });
}

const watched = new WeakSet<object>();

/** Alguns gráficos entram depois do primeiro render (radar, progresso): reajusta quando o conteúdo muda. */
export function watchCharts(root: Element | null | undefined): void {
  if (!root || watched.has(root) || typeof MutationObserver === 'undefined') return;
  watched.add(root);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fitCharts(root);
    });
  }).observe(root, { childList: true, subtree: true });
}
