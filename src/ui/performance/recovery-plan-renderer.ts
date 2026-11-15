import { renderIconSvg } from '../primitives/icon.js';

type Row = Record<string, any>;
type Esc = (value: any) => string;

export function formatRecoveryMinutes(value: unknown) {
  const minutes = Math.abs(Math.round(Number(value) || 0)),
    hours = Math.floor(minutes / 60),
    remainder = minutes % 60;
  return hours ? `${hours} h${remainder ? ` ${remainder} min` : ''}` : `${minutes} min`;
}

const statusLabels: Record<string, string> = {
  limited: 'Opções limitadas',
  unavailable: 'Sem proposta segura',
};
export function renderRecoveryPlan(plan: Row | null | undefined, escapeHtml: Esc, escapeAttr: Esc) {
  if (!plan || plan.status === 'not_needed') return '';
  if (plan.status !== 'recoverable')
    return `<section class="projection-recovery" aria-label="Plano de recuperação"><h4>O que você pode fazer?</h4><p>${statusLabels[plan.status] || statusLabels.unavailable}. ${escapeHtml(plan.reason || 'Ainda não há base suficiente para uma redistribuição segura.')}</p></section>`;
  const changed = plan.changes.filter((item: any) => item.deltaMinutes !== 0),
    preserved = plan.changes.filter((item: any) => item.deltaMinutes === 0);
  const duration = formatRecoveryMinutes;
  const row = (item: Row) =>
    `<li class="recovery-allocation"><strong>${escapeHtml(item.subjectName)}</strong><span>${duration(item.beforeMinutes)} → ${duration(item.afterMinutes)}</span><span class="recovery-allocation__change">${item.deltaMinutes > 0 ? `${renderIconSvg('arrow-up', { size: 14, className: 'inline-block align-text-bottom mr-1' })} Aumento de` : item.deltaMinutes < 0 ? `${renderIconSvg('arrow-down', { size: 14, className: 'inline-block align-text-bottom mr-1' })} Redução de` : `${renderIconSvg('minus', { size: 14, className: 'inline-block align-text-bottom mr-1' })} Sem alteração`}${item.deltaMinutes ? ` ${duration(item.deltaMinutes)}` : ''}</span></li>`;
  const reasons = plan.explanation || [];
  const explanation = (items: string[]) =>
    items.map((reason: any) => `<li>${escapeHtml(reason)}</li>`).join('');
  const transfer = `<strong>${escapeHtml(plan.to?.name || 'Destino')} recebe ${duration(plan.transferMinutes)}.</strong> A origem é ${escapeHtml(plan.from?.name || 'Origem')}.`;
  const capacity = `A capacidade semanal será preservada em ${duration(plan.capacity.current)}.`;
  const total = `<p class="recovery-total"><strong>Total planejado</strong><span>${duration(plan.totalMinutes.current)} → ${duration(plan.totalMinutes.proposed)} · Sem alteração</span></p>`;
  const confirmButton = plan.canApply
    ? `<button type="button" class="btn primary" data-recovery-confirm-open data-recovery-signature="${escapeAttr(plan.signature)}">Aplicar ao planejamento</button>`
    : '';
  const confirmDialog = plan.canApply
    ? `<dialog id="recoveryConfirmDialog" class="projection-scenario recovery-dialog" aria-labelledby="recoveryConfirmTitle"><form method="dialog"><div class="projection-scenario__heading"><h3 id="recoveryConfirmTitle">Aplicar plano de recuperação?</h3><button type="submit" class="btn ghost small" aria-label="Cancelar aplicação">Cancelar</button></div></form><p>${capacity}</p><p>${transfer}</p><ul class="recovery-allocations">${changed.map(row).join('')}</ul>${total}<p>Nenhuma sessão concluída será alterada. O plano anterior e o histórico serão preservados.</p><div class="recovery-dialog__actions"><button type="button" class="btn ghost" data-recovery-cancel>Voltar</button><button type="button" class="btn primary" data-recovery-apply data-recovery-signature="${escapeAttr(plan.signature)}">Confirmar alterações</button></div></dialog>`
    : '';
  return `<section class="projection-recovery" aria-label="Plano de recuperação"><h4>O que você pode fazer?</h4><p>Há uma proposta de redistribuição sem aumentar sua carga semanal. Ela move tempo entre disciplinas do plano; a ação de Hoje escolhe um tópico e é calculada à parte.</p><button type="button" class="btn ghost small" data-recovery-preview-open>Ver plano de recuperação</button><dialog id="recoveryPreviewDialog" class="projection-scenario recovery-dialog" aria-labelledby="recoveryPreviewTitle"><form method="dialog"><div class="projection-scenario__heading"><h3 id="recoveryPreviewTitle">Plano de recuperação</h3><button type="submit" class="btn ghost small" aria-label="Fechar prévia de recuperação">Fechar</button></div></form><p>${capacity}</p><p>${transfer}</p><h4>O que muda</h4><ul class="recovery-allocations">${changed.map(row).join('')}</ul>${total}${preserved.length ? `<p class="analytics-note">Disciplinas preservadas (${preserved.length}): ${preserved.map((item: any) => escapeHtml(item.subjectName)).join(', ')}.</p>` : ''}${reasons.length ? `<h4>Por que esta mudança?</h4><ul>${explanation(reasons)}</ul>` : ''}<p class="analytics-note">A prévia não alterou o plano nem o histórico.</p>${confirmButton}</dialog>${confirmDialog}</section>`;
}
