// Essential mode (F10) decorations: one-click reveals for advanced analyses and short term hints.
export const TERM_HINTS: Readonly<Record<string, string>> = Object.freeze({
  prontidao:
    'Nota de 0 a 100 que junta cobertura, domínio, retenção, consistência e simulados. Não é chance de aprovação.',
  conteudo: 'Parte dos tópicos do edital que você já concluiu.',
  revisoes: 'Revisões marcadas de hoje em diante, na agenda e no calendário.',
  sequencia: 'Dias seguidos com estudo, questões ou simulado registrados.',
  dominio: 'Taxa de acerto ponderada pela recência e pela amostra em cada tópico ou disciplina.',
  retencao:
    'Estabilidade da memória, estimada pelas revisões no prazo, pelos acertos recentes e pelo intervalo desde a última revisão.',
  aderencia: 'Parte do tempo ou das atividades planejadas que foi executada no período.',
});

let hintCount = 0;

/** Adds a "?" next to each [data-term] label that shows its short hint when pressed. */
export function decorateTermHints(root: ParentNode = document) {
  if (typeof root?.querySelectorAll !== 'function') return;
  root.querySelectorAll<HTMLElement>('[data-term]:not([data-term-ready])').forEach(label => {
    const hint = TERM_HINTS[label.dataset.term || ''];
    if (!hint) return;
    label.dataset.termReady = '';
    const doc = label.ownerDocument;
    const id = `termHint${++hintCount}`;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'term-hint';
    button.setAttribute('aria-label', `O que é ${label.textContent?.trim()}?`);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', id);
    const text = doc.createElement('span');
    text.id = id;
    text.className = 'term-hint-text';
    text.hidden = true;
    text.textContent = hint;
    button.addEventListener('click', () => {
      text.hidden = !text.hidden;
      button.setAttribute('aria-expanded', String(!text.hidden));
    });
    // The "?" is drawn by CSS and the hint sits after the label, so the label text stays the term itself.
    label.append(button);
    label.after(text);
  });
}

/** Opens an essential-mode [data-advanced] block and hides its "Mostrar …" button; callers that jump to a block (Ctrl+K, deep links) use this so essential mode never strands them. */
export function revealAdvanced(block: HTMLElement | null | undefined, focus = true) {
  if (!block) return;
  block.classList.add('is-advanced-open');
  const before = block.previousElementSibling as HTMLElement | null;
  if (before?.classList.contains('advanced-reveal')) before.hidden = true;
  if (!focus) return;
  if (!block.matches('button,a,summary,input,select,textarea,[tabindex]')) block.tabIndex = -1;
  block.focus({ preventScroll: true });
}

/** Puts a "Mostrar …" button before each [data-advanced] block; in essential mode it opens that block. */
export function decorateAdvancedReveals(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLElement>('[data-advanced]:not([data-advanced-ready])')
    .forEach(block => {
      block.dataset.advancedReady = '';
      const button = block.ownerDocument.createElement('button');
      button.type = 'button';
      button.className = 'btn ghost small advanced-reveal';
      button.textContent = `Mostrar ${block.dataset.advanced}`;
      button.addEventListener('click', () => revealAdvanced(block));
      block.before(button);
    });
}

/** Evidência mínima para sugerir o modo completo a quem começou no Essencial. */
export const ESSENTIAL_GRADUATION_DAYS = 14;
export const ESSENTIAL_GRADUATION_QUESTIONS = 300;

/**
 * Dias distintos com estudo ou questões e total de questões; quando um dos dois passa do mínimo,
 * as análises completas já têm o que mostrar e o modo completo pode ser oferecido.
 */
export function essentialGraduation({
  studySessions = [],
  questoes = [],
}: {
  studySessions?: Array<{ date?: string | null }>;
  questoes?: Array<{ date?: string | null; resolved?: number }>;
}): { ready: boolean; days: number; questions: number } {
  const days = new Set(
    [...studySessions, ...questoes].map(item => item?.date).filter(Boolean) as string[]
  ).size;
  const questions = questoes.reduce(
    (sum, item) => sum + Math.max(0, Number(item?.resolved) || 0),
    0
  );
  return {
    ready: days >= ESSENTIAL_GRADUATION_DAYS || questions >= ESSENTIAL_GRADUATION_QUESTIONS,
    days,
    questions,
  };
}

/**
 * Aviso único no topo da Visão geral: só no Essencial, com evidência e sem resposta anterior.
 * A resposta fica em `storage` para não voltar a aparecer.
 */
export function renderEssentialGraduation({
  slot,
  essentialOn,
  state,
  storage,
  onShowFull,
  key = 'studytrack.essential.graduation',
}: {
  slot: HTMLElement | null;
  essentialOn: boolean;
  state: {
    studySessions?: Array<{ date?: string | null }>;
    questoes?: Array<{ date?: string | null; resolved?: number }>;
  };
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  onShowFull: () => void;
  key?: string;
}) {
  if (!slot) return;
  let answered: string | null = null;
  try {
    answered = storage?.getItem(key) ?? null;
  } catch {
    answered = null;
  }
  const evidence = essentialGraduation(state);
  if (!essentialOn || answered || !evidence.ready) {
    slot.replaceChildren();
    return;
  }
  const remember = (value: string) => {
    try {
      storage?.setItem(key, value);
    } catch {
      // Modo privado: o aviso volta na próxima visita.
    }
    slot.replaceChildren();
  };
  const doc = slot.ownerDocument;
  const box = doc.createElement('aside');
  box.className = 'essential-graduation';
  box.setAttribute('aria-label', 'Análises completas disponíveis');
  const text = doc.createElement('p');
  text.textContent = `Você já registrou ${evidence.days} dias de estudo e ${evidence.questions} questões. Tendências, mapa de lacunas e inteligência da prova já têm evidência para mostrar.`;
  const show = doc.createElement('button');
  show.type = 'button';
  show.className = 'btn small';
  show.textContent = 'Ver análises completas';
  show.addEventListener('click', () => {
    remember('full');
    onShowFull();
  });
  const stay = doc.createElement('button');
  stay.type = 'button';
  stay.className = 'btn ghost small';
  stay.textContent = 'Continuar no Essencial';
  stay.addEventListener('click', () => remember('stay'));
  box.append(text, show, stay);
  slot.replaceChildren(box);
}
