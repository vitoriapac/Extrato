import {
  normalizeHelpText as normalize,
  matchesHelpSearch,
  rankHelpSearch,
} from './help-search.js';

declare const __STUDYTRACK_BUILD_VERSION__: string;

let helpBundleLoadPromise: Promise<any> | null = null;

export function loadHelpBundle(doc: any): Promise<any> {
  if (typeof globalThis !== 'undefined' && (globalThis as any).StudyTrackHelp) {
    return Promise.resolve((globalThis as any).StudyTrackHelp);
  }
  if (!helpBundleLoadPromise) {
    helpBundleLoadPromise = new Promise((resolve, reject) => {
      if (!doc || !doc.createElement || !doc.head) {
        if (typeof globalThis !== 'undefined' && (globalThis as any).StudyTrackHelp) {
          return resolve((globalThis as any).StudyTrackHelp);
        }
        return resolve(null);
      }
      const script = doc.createElement('script');
      const version =
        typeof __STUDYTRACK_BUILD_VERSION__ !== 'undefined' ? __STUDYTRACK_BUILD_VERSION__ : 'dev';
      script.src = new URL(
        `src/help.bundle.js?v=${version}`,
        doc.baseURI || 'http://localhost/'
      ).href;
      script.async = true;
      script.onload = () => {
        if ((globalThis as any).StudyTrackHelp) {
          resolve((globalThis as any).StudyTrackHelp);
        } else {
          reject(new Error('Módulo de Ajuda não inicializado.'));
        }
      };
      script.onerror = () => {
        helpBundleLoadPromise = null;
        reject(new Error('Não foi possível carregar a Central de Ajuda.'));
      };
      doc.head.appendChild(script);
    });
  }
  return helpBundleLoadPromise;
}

const DESTINATIONS: Readonly<Record<string, { tab: string; selector?: string; section?: string }>> =
  Object.freeze({
    projection: { tab: 'desempenho', section: 'overview', selector: '.achievement-projection' },
    adherence: { tab: 'desempenho', section: 'consistency', selector: '.adherence-summary' },
    subjects: { tab: 'disciplinas', selector: '#addSubjectBtn' },
    overview: { tab: 'dashboard', selector: '#balanceFigure' },
    timer: { tab: 'dashboard', selector: '#timerSubjectSelect' },
    questions: { tab: 'questoes', selector: '#addQuestaoRowBtn' },
    reviews: { tab: 'agenda', selector: '#addAgendaRowBtn' },
    today: { tab: 'hoje', selector: '#panel-hoje' },
    calendar: { tab: 'calendario', selector: '#panel-calendario' },
    planning: { tab: 'metas', selector: '#examStudyPlan' },
    weekly: { tab: 'dashboard', selector: '#weeklyCloseDashboard' },
    diagnosis: { tab: 'hoje', selector: '#diagnosisCenter' },
    achievements: { tab: 'dashboard', selector: '#badgesGrid' },
    history: { tab: 'dashboard', selector: '#decisionHistoryDashboard' },
    report: { tab: 'instrucoes', selector: '#exportReportBtn' },
    exam: { tab: 'desempenho', section: 'exam', selector: '#examIntelligenceOverview' },
    audit: { tab: 'desempenho', section: 'exam', selector: '#examConfigurationAudit' },
    matrix: { tab: 'desempenho', section: 'exam', selector: '#examHistoricalMatrix' },
    backup: { tab: 'instrucoes', selector: '#exportBackupBtn' },
    demo: { tab: 'instrucoes', selector: '#enterDemoBtn' },
  });

function highlightMatches(scope: Node, query: string, document: any, window: any) {
  const walker = document.createTreeWalker(scope, window.NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('[hidden]')) continue;
    if (normalize(node.nodeValue).includes(query)) nodes.push(node);
  }
  for (const node of nodes) {
    const value = node.nodeValue;
    let folded = '',
      offset = 0;
    const positions = [];
    for (const char of value) {
      const part = normalize(char);
      for (let index = 0; index < part.length; index++)
        positions.push([offset, offset + char.length]);
      folded += part;
      offset += char.length;
    }
    const fragment = document.createDocumentFragment();
    let cursor = 0,
      match = folded.indexOf(query);
    while (match !== -1) {
      const start = positions[match][0],
        end = positions[match + query.length - 1][1];
      fragment.append(document.createTextNode(value.slice(cursor, start)));
      const mark = document.createElement('mark');
      mark.className = 'help-match';
      mark.dataset.helpMatch = '';
      mark.textContent = value.slice(start, end);
      fragment.append(mark);
      cursor = end;
      match = folded.indexOf(query, match + query.length);
    }
    fragment.append(document.createTextNode(value.slice(cursor)));
    node.replaceWith(fragment);
  }
}

export function createHelpController({
  document,
  window,
  activateTab,
  renderHelpCenter,
}: {
  document: any;
  window: any;
  activateTab: (tab: string) => void;
  renderHelpCenter?: (options?: any) => string;
}) {
  const root = document.getElementById('helpCenter');
  if (!root) return { mount: () => false };
  let activeCategory = 'guide-start';
  let returnContext: Record<string, any> | null = null;
  let originalGroups: any[] = [],
    originalTopics = new Map();
  let isMounted = false;
  let isMounting = false;

  const initFromDOM = () => {
    originalGroups = [...(root.querySelector('#helpGroups')?.children || [])];
    originalTopics = new Map(
      [...root.querySelectorAll('[data-help-group]')].map(group => [
        group,
        [...group.querySelectorAll('[data-help-topic]')],
      ])
    );
    activeCategory =
      root.querySelector('[data-help-category]')?.dataset.helpCategory || 'guide-start';
    applySearch();
    isMounted = true;
    isMounting = false;
  };

  const ensureMounted = async () => {
    if (isMounted) return true;
    if (isMounting) return false;
    isMounting = true;

    const renderer = renderHelpCenter || (globalThis as any).StudyTrackHelp?.renderHelpCenter;
    if (renderer) {
      root.innerHTML = renderer();
      initFromDOM();
      return true;
    }

    try {
      const runtime = await loadHelpBundle(document);
      const lazyRenderer =
        runtime?.renderHelpCenter || (globalThis as any).StudyTrackHelp?.renderHelpCenter;
      if (lazyRenderer) {
        root.innerHTML = lazyRenderer();
        initFromDOM();
        return true;
      }
    } catch {
      // Fallback gracioso em caso de falha de rede
    }
    isMounting = false;
    return false;
  };
  const applySearch = () => {
    const parents = new Set();
    for (const mark of root.querySelectorAll('[data-help-match]')) {
      parents.add(mark.parentNode);
      mark.replaceWith(document.createTextNode(mark.textContent));
    }
    for (const parent of parents) (parent as any).normalize();
    const query = normalize(root.querySelector('#helpSearch')?.value.trim());
    let matches = 0;
    const scores = new Map();
    for (const group of root.querySelectorAll('[data-help-group]')) {
      let groupMatches = 0;
      const categoryMatches = Boolean(
        query && normalize(group.querySelector('.help-group-heading')?.textContent).includes(query)
      );
      for (const topic of group.querySelectorAll('[data-help-topic]')) {
        const visible =
          !query ||
          categoryMatches ||
          matchesHelpSearch(topic.textContent + ' ' + (topic.dataset.helpSearch || ''), query);
        topic.hidden = !visible;
        scores.set(
          topic,
          query && visible
            ? rankHelpSearch(
                {
                  title: topic.dataset.helpTitle,
                  keywords: [topic.dataset.helpKeywords || ''],
                  paragraphs: [topic.textContent, topic.dataset.helpSearch || ''],
                },
                query
              )
            : 0
        );
        if (visible) groupMatches++;
      }
      group.hidden = query ? Boolean(!groupMatches) : group.id !== activeCategory;
      matches += query ? groupMatches : 0;
      const topics = originalTopics.get(group) || [];
      for (const topic of [...topics].sort((a, b) =>
        query ? (scores.get(b) || 0) - (scores.get(a) || 0) : 0
      ))
        group.querySelector('.help-group-body').append(topic);
      scores.set(group, Math.max(0, ...topics.map((topic: any) => scores.get(topic) || 0)));
    }
    for (const section of root.querySelectorAll('.help-reference')) {
      let sectionMatches = 0;
      const headingMatches = Boolean(
        query && normalize(section.querySelector('h3')?.textContent).includes(query)
      );
      for (const item of section.querySelectorAll('.help-reference-item')) {
        const visible = !query || headingMatches || matchesHelpSearch(item.textContent, query);
        item.hidden = !visible;
        if (visible) sectionMatches++;
      }
      section.hidden = query ? Boolean(!sectionMatches) : activeCategory !== 'guide-safety';
      matches += query ? sectionMatches : 0;
    }
    for (const node of [...originalGroups].sort((a, b) =>
      query ? (scores.get(b) || 0) - (scores.get(a) || 0) : 0
    ))
      root.querySelector('#helpGroups').append(node);
    const principle = root.querySelector('[data-help-principle]');
    if (principle) {
      principle.hidden = query
        ? Boolean(!normalize(principle.textContent).includes(query))
        : activeCategory !== 'guide-workflows';
      if (query && !principle.hidden) matches++;
    }
    const noResults = root.querySelector('#helpNoResults');
    if (noResults) noResults.hidden = !query || matches > 0;
    const searchStatus = root.querySelector('#helpSearchStatus');
    if (searchStatus) {
      searchStatus.textContent = query
        ? `${matches} ${matches === 1 ? 'assunto encontrado' : 'assuntos encontrados'}.`
        : '';
    }
    const searchClear = root.querySelector('#helpSearchClear');
    if (searchClear) searchClear.hidden = !query;
    if (query) {
      for (const section of root.querySelectorAll(
        '[data-help-group]:not([hidden]),[data-help-principle]:not([hidden]),.help-reference:not([hidden])'
      ))
        highlightMatches(section, query, document, window);
    }
  };
  const openCategory = (id: string) => {
    const search = root.querySelector('#helpSearch');
    if (search.value) {
      search.value = '';
      applySearch();
    }
    const group = [...root.querySelectorAll('[data-help-group]')].find(item => item.id === id);
    if (!group) return;
    activeCategory = id;
    applySearch();
    for (const button of root.querySelectorAll('[data-help-category]')) {
      if (button.dataset.helpCategory === id) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    group.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    group.focus({ preventScroll: true });
  };
  const openTopic = async (id: string) => {
    await ensureMounted();
    const topic = [...root.querySelectorAll('[data-help-topic]')].find(item => item.id === id);
    if (!topic) return false;
    const origin = document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.tab;
    if (origin && origin !== 'instrucoes') returnContext = { tab: origin, topic: id };
    activateTab('instrucoes');
    if (returnContext && !root.querySelector('[data-help-return]')) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'btn ghost small';
      back.dataset.helpReturn = '';
      back.textContent = 'Voltar à análise de origem';
      root.querySelector('.help-hero')?.append(back);
    }
    openCategory(topic.closest('[data-help-group]').id);
    window.requestAnimationFrame(() => {
      topic.tabIndex = -1;
      topic.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
      topic.focus({ preventScroll: true });
    });
    return true;
  };
  const navigate = (key: string) => {
    const destination = DESTINATIONS[key];
    if (!destination) return;
    activateTab(destination.tab);
    if (destination.section)
      document.querySelector(`[data-performance-section="${destination.section}"]`)?.click();
    window.requestAnimationFrame(() => {
      const target =
        document.querySelector(destination.selector) ||
        document.getElementById(`tab-${destination.tab}`);
      if (!target) return;
      for (
        let parent = target.closest('details');
        parent;
        parent = parent.parentElement?.closest('details')
      )
        parent.open = true;
      if (!target.matches('button,input,select,a,summary,[tabindex]')) target.tabIndex = -1;
      target.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
      target.focus({ preventScroll: true });
    });
  };
  const mount = () => {
    const renderer = renderHelpCenter || (globalThis as any).StudyTrackHelp?.renderHelpCenter;
    if (renderer) {
      root.innerHTML = renderer();
      initFromDOM();
    } else {
      document.addEventListener('click', (event: any) => {
        if (event.target.closest('[data-tab="instrucoes"], #tab-instrucoes')) {
          ensureMounted();
        }
      });
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => ensureMounted(), { timeout: 3500 });
      } else if (typeof window.setTimeout === 'function') {
        window.setTimeout(() => ensureMounted(), 2000);
      }
    }
    document.addEventListener('click', async (event: any) => {
      const link = event.target.closest('[data-help-topic-link]');
      if (link && (await openTopic(link.dataset.helpTopicLink))) event.preventDefault();
    });
    root.addEventListener('input', (event: any) => {
      if (event.target.id === 'helpSearch') applySearch();
    });
    root.addEventListener('keydown', (event: any) => {
      if (event.target.id === 'helpSearch' && event.key === 'Escape') {
        event.target.value = '';
        applySearch();
        event.preventDefault();
      }
    });
    root.addEventListener('click', (event: any) => {
      const chip = event.target.closest('[data-help-chip]');
      if (chip) {
        const query = chip.dataset.helpChip;
        const search = root.querySelector('#helpSearch');
        if (search) {
          search.value = query;
          applySearch();
          search.focus();
        }
        return;
      }
      const copyBtn = event.target.closest('[data-help-copy-link]');
      if (copyBtn) {
        const topicId = copyBtn.dataset.helpCopyLink;
        const url = `${window.location?.origin || ''}${window.location?.pathname || ''}#instrucoes?topic=${topicId}`;
        if (window.navigator?.clipboard?.writeText) {
          window.navigator.clipboard.writeText(url).catch(() => {});
        }
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copiado';
        copyBtn.setAttribute('aria-label', 'Atalho copiado para a área de transferência');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.setAttribute('aria-label', `Copiar link direto para ${topicId}`);
        }, 2000);
        return;
      }
      const voteBtn = event.target.closest('[data-help-vote]');
      if (voteBtn) {
        const topicId = voteBtn.dataset.helpTopic;
        const isHelpful = voteBtn.dataset.helpVote === 'yes';
        const mountEl = voteBtn.closest('[data-help-feedback]');
        const helpRuntime = (globalThis as any).StudyTrackHelp;
        if (topicId && mountEl) {
          if (helpRuntime?.saveTopicFeedback && window.localStorage) {
            helpRuntime.saveTopicFeedback(window.localStorage, topicId, isHelpful);
          }
          mountEl.innerHTML = `<span class="help-feedback-thanks">✓ Obrigado! ${isHelpful ? 'Ficamos felizes que ajudou.' : 'Vamos aprimorar esta explicação.'}</span>`;
        }
        return;
      }
      if (event.target.closest('[data-help-return]') && returnContext) {
        const context = returnContext;
        returnContext = null;
        root.querySelector('[data-help-return]')?.remove();
        activateTab(context.tab);
        window.requestAnimationFrame(() => {
          const panel = document.getElementById('panel-' + context.tab);
          const target =
            panel?.querySelector(`[data-help-topic-link="${window.CSS.escape(context.topic)}"]`) ||
            document.getElementById('tab-' + context.tab);
          if (!target) return;
          for (
            let parent = target.closest('details');
            parent;
            parent = parent.parentElement?.closest('details')
          )
            parent.open = true;
          target.scrollIntoView({ block: 'center', behavior: 'auto' });
          target.focus({ preventScroll: true });
        });
        return;
      }
      const category = event.target.closest('[data-help-category]');
      if (category) {
        openCategory(category.dataset.helpCategory);
        return;
      }
      if (event.target.closest('#helpSearchClear')) {
        const search = root.querySelector('#helpSearch');
        search.value = '';
        applySearch();
        search.focus();
        return;
      }
      const action = event.target.closest('[data-help-action]');
      if (action) navigate(action.dataset.helpAction);
    });

    const handleHashRoute = () => {
      const hash = window.location?.hash;
      if (!hash || !hash.startsWith('#instrucoes')) return;
      let topicId = null;
      if (hash.includes('?topic=')) {
        topicId = hash.split('?topic=')[1]?.split('&')[0];
      } else if (hash.includes('/')) {
        topicId = hash.split('/')[1]?.split('?')[0];
      }
      if (topicId) {
        openTopic(topicId);
      }
    };
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('hashchange', handleHashRoute);
      handleHashRoute();
    }
    return true;
  };
  return { mount, applySearch, openCategory, navigate, openTopic };
}
