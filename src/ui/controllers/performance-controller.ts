import { routeOfSection } from '../performance/performance-route.js';
import { updatePerformanceViewState } from '../../application/performance/performance-view-state.js';
import { scrollBehavior } from '../accessibility.js';
import { formatLocalDate } from '../../core/date-utils.js';
import { getDefaultUsageTelemetryService } from '../../application/telemetry/usage-telemetry-service.js';

/** Alt + 1–5 troca de subaba; Alt + 6–9 muda o período (7 dias, 30 dias, 90 dias, todo o histórico). */
const SHORTCUT_SECTIONS = ['overview', 'subjects', 'diagnosis', 'questions', 'consistency'];
const SHORTCUT_PERIODS = ['7', '30', '90', 'all'];
export function performanceShortcut(event: any = {}) {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
  const match = /^Digit([1-9])$/.exec(event.code || '');
  if (!match) return null;
  const n = Number(match[1]);
  return n <= 5 ? { section: SHORTCUT_SECTIONS[n - 1] } : { period: SHORTCUT_PERIODS[n - 6] };
}

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
  const telemetry = getDefaultUsageTelemetryService();
  const currentFeature = () => `desempenho:${getViewState()?.section || 'overview'}`;
  return {
    register() {
      document.addEventListener('keydown', (event: any) => {
        const patch = performanceShortcut(event);
        if (!patch) return;
        if (!document.getElementById('panel-desempenho')?.classList?.contains('active')) return;
        const target = event.target as HTMLElement | null;
        if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
        event.preventDefault();
        update(patch);
        telemetry.track(
          patch.section ? 'tab_open' : 'chart_filter_interaction',
          currentFeature()
        );
        render();
      });
      document.addEventListener('click', (event: any) => {
        const jump = event.target.closest('[data-performance-jump]');
        if (!jump) return;
        update({ section: jump.dataset.performanceJump });
        if (jump.dataset.performanceSubjectId)
          update({ subjectId: jump.dataset.performanceSubjectId });
        if (jump.dataset.performanceTopicId) update({ topicId: jump.dataset.performanceTopicId });
        telemetry.track('tab_open', `desempenho:${jump.dataset.performanceJump}`);
        activateTab('desempenho');
      });
      // Escape na confirmação equivale a Cancelar: volta à prévia (o evento close não borbulha, por isso captura).
      let recoveryApplying = false;
      document.addEventListener(
        'close',
        (event: Event) => {
          if ((event.target as HTMLElement | null)?.id !== 'recoveryConfirmDialog') return;
          if (recoveryApplying) {
            recoveryApplying = false;
            return;
          }
          const preview = document.getElementById('recoveryPreviewDialog') as HTMLDialogElement | null;
          if (preview && !preview.open) {
            preview.showModal();
            preview.querySelector<HTMLElement>('[data-recovery-confirm-open]')?.focus();
          }
        },
        true
      );
      document.getElementById('performancePage')?.addEventListener('click', (event: any) => {
        if (event.target.closest('[data-projection-scenario-open]')) {
          telemetry.track('detail_access', currentFeature());
          document.getElementById('projectionScenarioDialog')?.showModal();
          return;
        }
        if (event.target.closest('[data-recovery-preview-open]')) {
          telemetry.track('detail_access', currentFeature());
          document.getElementById('recoveryPreviewDialog')?.showModal();
          return;
        }
        if (event.target.closest('[data-recovery-confirm-open]')) {
          document.getElementById('recoveryPreviewDialog')?.close();
          document.getElementById('recoveryConfirmDialog')?.showModal();
          return;
        }
        if (event.target.closest('[data-recovery-cancel]')) {
          document.getElementById('recoveryConfirmDialog')?.close();
          document.getElementById('recoveryPreviewDialog')?.showModal();
          return;
        }
        const recoveryApply = event.target.closest('[data-recovery-apply]');
        if (recoveryApply) {
          recoveryApplying = true;
          document.getElementById('recoveryConfirmDialog')?.close();
          document.getElementById('recoveryPreviewDialog')?.close();
          applyRecovery((recoveryApply as any).dataset.recoverySignature);
          return;
        }
        const inComponentNav = Boolean(event.target.closest('[data-performance-nav]'));
        const group = !inComponentNav && event.target.closest('[data-performance-group]');
        if (group) {
          update({ section: group.dataset.performanceGroupTarget });
          telemetry.track('tab_open', currentFeature());
          render();
          return;
        }
        const subjectView = event.target.closest('[data-performance-subject-view]');
        if (subjectView) {
          update({ subjectView: subjectView.dataset.performanceSubjectView });
          telemetry.track('chart_filter_interaction', currentFeature());
          render();
          return;
        }
        const compareMode = event.target.closest('[data-performance-compare-mode]');
        if (compareMode) {
          update({ compareMode: compareMode.dataset.performanceCompareMode });
          telemetry.track('chart_filter_interaction', currentFeature());
          render();
          return;
        }
        const questionSubject = event.target.closest(
          '[data-performance-question-subject]'
        ) as HTMLElement | null;
        if (questionSubject) {
          const id = questionSubject.dataset.performanceQuestionSubject || '';
          update({ toggleQuestionSubject: id });
          telemetry.track('chart_filter_interaction', currentFeature());
          render();
          (
            document.querySelector(
              `[data-performance-question-subject="${id}"]`
            ) as HTMLElement | null
          )?.focus?.();
          return;
        }
        if (event.target.closest('[data-performance-question-subjects-reset]')) {
          update({ selectedQuestionSubjects: [] });
          telemetry.track('chart_filter_interaction', currentFeature());
          render();
          return;
        }
        const section = event.target.closest(
          inComponentNav
            ? '[data-performance-investigate]'
            : '[data-performance-section],[data-performance-investigate]'
        );
        if (section) {
          const fromTopicDialog = Boolean(section.closest?.('#performanceTopicDialog'));
          if (fromTopicDialog) document.getElementById('performanceTopicDialog')?.close?.();
          update({
            section: section.dataset.performanceSection || section.dataset.performanceInvestigate,
            ...(fromTopicDialog ? { topicId: null } : {}),
            ...(section.dataset.performanceSubjectId
              ? { subjectId: section.dataset.performanceSubjectId }
              : {}),
          });
          telemetry.track('tab_open', currentFeature());
          render();
          return;
        }
        const focusSubjectDetail = () => {
          // O detalhe fica bem abaixo da lista: leva a tela e o foco até ele.
          const detail = document.querySelector('[data-performance-subject]') as HTMLElement | null;
          detail?.scrollIntoView?.({ block: 'start', behavior: scrollBehavior() });
          detail?.focus?.({ preventScroll: true });
        };
        const compared = event.target.closest('[data-performance-compare-subject]');
        if (compared) {
          update({ subjectId: compared.dataset.performanceCompareSubject });
          render();
          focusSubjectDetail();
          return;
        }
        const stable = event.target.closest('[data-stability-subject]');
        if (stable) {
          update({ subjectId: stable.dataset.stabilitySubject });
          render();
          focusSubjectDetail();
          return;
        }
        const topic = event.target.closest('[data-performance-topic]');
        if (topic) {
          update({ topicId: topic.dataset.performanceTopic });
          telemetry.track('detail_access', currentFeature());
          render();
          return;
        }
        if (event.target.closest('[data-performance-close-topic]')) {
          document.getElementById('performanceTopicDialog')?.close();
          return;
        }
        const filters = event.target.closest(
          '[data-performance-filters-toggle]'
        ) as HTMLElement | null;
        if (filters) {
          const toolbar = filters.closest('.performance-toolbar') as HTMLElement | null;
          const collapsed = toolbar?.dataset.collapsed !== 'false';
          if (toolbar) toolbar.dataset.collapsed = collapsed ? 'false' : 'true';
          filters.setAttribute('aria-expanded', String(collapsed));
          filters.textContent = collapsed ? 'Recolher filtros' : 'Alterar filtros';
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
          const url = `${window.location.origin}${window.location.pathname}#desempenho/${routeOfSection(section)}${copy.dataset.performanceCopyLink ? `/${copy.dataset.performanceCopyLink}` : ''}`;
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
            .catch(() => {
              say('Copie o link ao lado', 'Não foi possível copiar automaticamente; selecione o link ao lado');
              let fallback = copy.parentElement?.querySelector('[data-performance-copy-fallback]') as HTMLInputElement | null;
              if (!fallback && copy.parentElement) {
                const input = document.createElement('input');
                input.type = 'text';
                input.readOnly = true;
                input.className = 'input-control text-xs';
                input.setAttribute('data-performance-copy-fallback', 'true');
                input.setAttribute('aria-label', 'Link desta seção para copiar');
                copy.insertAdjacentElement('afterend', input);
                fallback = input;
              }
              if (fallback) {
                fallback.value = url;
                fallback.focus();
                fallback.select();
              }
            });
          return;
        }
        // "Ajustar plano": abre Metas com a prévia de ajuste à vista; nada é aplicado sem confirmação lá.
        if (event.target.closest('[data-performance-adjust-plan]')) {
          telemetry.track('plan_adjust_after_analysis', currentFeature());
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
          if (open.closest?.('.performance-reading__todo')) {
            telemetry.track('recommendation_click', currentFeature());
          }
          document.getElementById('performanceTopicDialog')?.close();
          activateTab(open.dataset.performanceOpen);
        }
      });
      // Subabas como tablist e controles segmentados: setas, Home e End movem o foco.
      document.getElementById('performancePage')?.addEventListener('keydown', (event: any) => {
        if (event.target.closest?.('[data-performance-nav]')) return;
        const segButton = event.target.closest?.(
          '.performance-modes button, .performance-proof-index button, .exam-matrix-modes button'
        ) as HTMLElement | null;
        if (segButton && !event.altKey && !event.ctrlKey && !event.metaKey) {
          const groupButtons = [
            ...(segButton.parentElement?.querySelectorAll('button') || []),
          ] as HTMLElement[];
          const pos = groupButtons.indexOf(segButton);
          const nextSeg =
            event.key === 'ArrowRight'
              ? groupButtons[(pos + 1) % groupButtons.length]
              : event.key === 'ArrowLeft'
                ? groupButtons[(pos - 1 + groupButtons.length) % groupButtons.length]
                : event.key === 'Home'
                  ? groupButtons[0]
                  : event.key === 'End'
                    ? groupButtons[groupButtons.length - 1]
                    : null;
          if (nextSeg) {
            event.preventDefault();
            nextSeg.focus();
            return;
          }
        }
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
        const form = event.target as HTMLFormElement;
        const data = new FormData(form);
        const capacityHours = Number(data.get('capacityHours'));
        const examDate = String(data.get('examDate') || '');
        const targetScore = Number(data.get('targetScore'));
        const destination = document.getElementById('projectionScenarioResult');
        const todayKey = formatLocalDate(new Date()) || '';
        const capacityInput = form.querySelector('[name="capacityHours"]') as HTMLElement | null;
        const examDateInput = form.querySelector('[name="examDate"]') as HTMLElement | null;
        capacityInput?.removeAttribute('aria-invalid');
        examDateInput?.removeAttribute('aria-invalid');
        const showScenarioAlert = (message: string, field: HTMLElement | null) => {
          field?.setAttribute('aria-invalid', 'true');
          if (destination) {
            const alert = document.createElement('p');
            alert.setAttribute('role', 'alert');
            alert.textContent = message;
            destination.replaceChildren(alert);
          }
          field?.focus();
        };
        if (!Number.isFinite(capacityHours) || capacityHours <= 0) {
          showScenarioAlert(
            'Informe uma capacidade semanal maior que 0 horas para simular.',
            capacityInput
          );
          return;
        }
        if (!examDate || (todayKey && examDate < todayKey)) {
          showScenarioAlert(
            'Informe uma data da prova igual ou posterior a hoje.',
            examDateInput
          );
          return;
        }
        const result = simulateScenario({
          weeklyCapacityMinutes: capacityHours * 60,
          examDate,
          targetScore,
        });
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
        telemetry.track('chart_filter_interaction', currentFeature());
        render();
        if (field.matches('[data-adherence-weeks]'))
          document.querySelector('[data-adherence-weeks]')?.focus();
      });
    },
  };
}
