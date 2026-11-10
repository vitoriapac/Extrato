import { updatePerformanceViewState } from '../../application/performance/performance-view-state.js';
import { scrollBehavior } from '../accessibility.js';

export function createPerformanceController({
  document,
  getViewState,
  setViewState,
  render,
  activateTab,
  simulateScenario,
  renderScenarioResult,
  applyRecovery = (_signature?: any) => {},
}: any) {
  const update = (patch: Record<string, any>) =>
    setViewState(updatePerformanceViewState(getViewState(), patch));
  return {
    register() {
      document.addEventListener('click', (event: any) => {
        const jump = event.target.closest('[data-performance-jump]');
        if (!jump) return;
        update({ section: jump.dataset.performanceJump });
        if (jump.dataset.performanceSubjectId)
          update({ subjectId: jump.dataset.performanceSubjectId });
        if (jump.dataset.performanceTopicId) update({ topicId: jump.dataset.performanceTopicId });
        activateTab('desempenho');
      });
      document.getElementById('performancePage')?.addEventListener('click', (event: any) => {
        if (event.target.closest('[data-projection-scenario-open]')) {
          document.getElementById('projectionScenarioDialog')?.showModal();
          return;
        }
        if (event.target.closest('[data-recovery-preview-open]')) {
          document.getElementById('recoveryPreviewDialog')?.showModal();
          return;
        }
        if (event.target.closest('[data-recovery-confirm-open]')) {
          document.getElementById('recoveryConfirmDialog')?.showModal();
          return;
        }
        if (event.target.closest('[data-recovery-cancel]')) {
          document.getElementById('recoveryConfirmDialog')?.close();
          return;
        }
        const recoveryApply = event.target.closest('[data-recovery-apply]');
        if (recoveryApply) {
          document.getElementById('recoveryConfirmDialog')?.close();
          document.getElementById('recoveryPreviewDialog')?.close();
          applyRecovery((recoveryApply as any).dataset.recoverySignature);
          return;
        }
        const group = event.target.closest('[data-performance-group]');
        if (group) {
          update({ section: group.dataset.performanceGroupTarget });
          render();
          return;
        }
        const section = event.target.closest(
          '[data-performance-section],[data-performance-investigate]'
        );
        if (section) {
          update({
            section: section.dataset.performanceSection || section.dataset.performanceInvestigate,
            ...(section.dataset.performanceSubjectId
              ? { subjectId: section.dataset.performanceSubjectId }
              : {}),
          });
          render();
          return;
        }
        const compared = event.target.closest('[data-performance-compare-subject]');
        if (compared) {
          update({ subjectId: compared.dataset.performanceCompareSubject });
          render();
          return;
        }
        const stable = event.target.closest('[data-stability-subject]');
        if (stable) {
          update({ subjectId: stable.dataset.stabilitySubject });
          render();
          // O detalhe fica bem abaixo da lista: leva a tela e o foco até ele.
          const detail = document.querySelector('[data-performance-subject]') as HTMLElement | null;
          detail?.scrollIntoView?.({ block: 'start', behavior: scrollBehavior() });
          detail?.focus?.({ preventScroll: true });
          return;
        }
        const topic = event.target.closest('[data-performance-topic]');
        if (topic) {
          update({ topicId: topic.dataset.performanceTopic });
          render();
          return;
        }
        if (event.target.closest('[data-performance-close-topic]')) {
          document.getElementById('performanceTopicDialog')?.close();
          return;
        }
        const reveal = event.target.closest('[data-performance-reveal]') as HTMLElement | null;
        if (reveal) {
          const fold = document.querySelector(
            '.performance-details--trajectory'
          ) as HTMLDetailsElement | null;
          if (fold) {
            fold.open = true;
            fold.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
          }
          return;
        }
        const copy = event.target.closest('[data-performance-copy-link]') as HTMLElement | null;
        if (copy) {
          const section =
            document.getElementById('panel-desempenho')?.dataset.performanceView || 'overview';
          const url = `${window.location.origin}${window.location.pathname}#desempenho/${section}/${copy.dataset.performanceCopyLink}`;
          const label = copy.textContent;
          const ariaLabel = copy.getAttribute('aria-label');
          const say = (text: string, name: string) => {
            copy.textContent = text;
            copy.setAttribute('aria-label', name);
          };
          Promise.resolve(window.navigator?.clipboard?.writeText(url))
            .then(() => {
              say('Link copiado', 'Link copiado para a área de transferência');
              window.setTimeout(() => say(label || '', ariaLabel || ''), 2000);
            })
            .catch(() => say('Não foi possível copiar', 'Não foi possível copiar o link'));
          return;
        }
        // "Ajustar plano": abre Metas com a prévia de ajuste à vista; nada é aplicado sem confirmação lá.
        if (event.target.closest('[data-performance-adjust-plan]')) {
          document.getElementById('performanceTopicDialog')?.close();
          activateTab('metas');
          requestAnimationFrame(() => {
            const fold = document.getElementById('metasAdjust') as HTMLDetailsElement | null;
            if (!fold) return;
            fold.open = true;
            fold.scrollIntoView({ block: 'start' });
            (fold.querySelector(':scope > summary') as HTMLElement | null)?.focus();
          });
          return;
        }
        const open = event.target.closest('[data-performance-open]');
        if (open) {
          document.getElementById('performanceTopicDialog')?.close();
          activateTab(open.dataset.performanceOpen);
        }
      });
      // Subabas como tablist: setas, Home e End ativam a subaba vizinha e mantêm o foco nela.
      document.getElementById('performancePage')?.addEventListener('keydown', (event: any) => {
        const tabSelector =
          '[role="tab"][data-performance-section],[role="tab"][data-performance-group]';
        const tab = event.target.closest?.(tabSelector);
        if (!tab || event.altKey || event.ctrlKey || event.metaKey) return;
        const tabs = [...tab.parentElement.querySelectorAll(tabSelector)];
        const index = tabs.indexOf(tab);
        const target =
          event.key === 'ArrowRight'
            ? tabs[(index + 1) % tabs.length]
            : event.key === 'ArrowLeft'
              ? tabs[(index - 1 + tabs.length) % tabs.length]
              : event.key === 'Home'
                ? tabs[0]
                : event.key === 'End'
                  ? tabs.at(-1)
                  : null;
        if (!target) return;
        event.preventDefault();
        const group = target.dataset.performanceGroup;
        update({
          section: target.dataset.performanceSection || target.dataset.performanceGroupTarget,
        });
        render();
        (
          document.querySelector(
            group
              ? `[role="tab"][data-performance-group="${group}"]`
              : `[role="tab"][data-performance-section="${target.dataset.performanceSection}"]`
          ) as HTMLElement | null
        )?.focus();
      });
      document.getElementById('performancePage')?.addEventListener('submit', (event: any) => {
        if (!event.target.matches('[data-projection-scenario-form]')) return;
        event.preventDefault();
        const form = event.target,
          data = new FormData(form),
          result = simulateScenario({
            weeklyCapacityMinutes: Number(data.get('capacityHours')) * 60,
            examDate: String(data.get('examDate') || ''),
            targetScore: Number(data.get('targetScore')),
          });
        const destination = document.getElementById('projectionScenarioResult');
        if (destination) destination.innerHTML = renderScenarioResult(result);
      });
      document.getElementById('performancePage')?.addEventListener('change', (event: any) => {
        const field = event.target;
        if (field.matches('[data-performance-period]')) update({ period: field.value });
        else if (field.matches('[data-performance-compare]'))
          update({ comparePrevious: field.checked });
        else if (field.matches('[data-performance-subject]')) update({ subjectId: field.value });
        else if (field.matches('[data-performance-subject-sort]'))
          update({ subjectSort: field.value });
        else if (field.matches('[data-adherence-weeks]')) update({ adherenceWeeks: field.value });
        else return;
        render();
        if (field.matches('[data-adherence-weeks]'))
          document.querySelector('[data-adherence-weeks]')?.focus();
      });
    },
  };
}
