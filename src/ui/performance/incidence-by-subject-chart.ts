import { renderBulletBar } from '../primitives/charts/charts.js';

type Row = Record<string, any>;
const VISIBLE = 8;
const MIN_SUBJECTS = 3;
const escape = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]!);
const decimal = (value: number) => String(Math.round(value * 10) / 10).replace('.', ',');

/**
 * O que a banca cobra × o que você sabe, por disciplina. Peso = parte das questões da banca analisadas;
 * domínio = média dos tópicos com domínio medido (0 a 100). São duas escalas: cada coluna tem a sua.
 */
export function renderIncidenceBySubject(rows: Row[] = [], analyzedQuestionCount = 0) {
  if (!analyzedQuestionCount) return '';
  const bySubject = new Map<string, { questions: number; mastery: number[] }>();
  for (const row of rows) {
    const entry = bySubject.get(row.subjectName) || { questions: 0, mastery: [] };
    entry.questions += Number(row.questionCount) || 0;
    if (Number.isFinite(row.mastery)) entry.mastery.push(row.mastery);
    bySubject.set(row.subjectName, entry);
  }
  const subjects = [...bySubject]
    .map(([name, entry]) => ({
      name,
      weight: (entry.questions / analyzedQuestionCount) * 100,
      mastery: entry.mastery.length ? entry.mastery.reduce((sum, value) => sum + value, 0) / entry.mastery.length : null,
      measured: entry.mastery.length,
    }))
    .filter(item => item.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  if (subjects.length < MIN_SUBJECTS) return '';
  const maxWeight = Math.max(10, Math.ceil(subjects[0].weight / 5) * 5);
  const line = (item: (typeof subjects)[number]) =>
    `<li class="incidence-subject__row"><span class="incidence-subject__name">${escape(item.name)}</span>${renderBulletBar({ value: Math.round(item.weight * 10) / 10, max: maxWeight, label: `${item.name}: ${decimal(item.weight)}% das questões da banca analisadas`, unit: '%', className: 'incidence-subject__bar incidence-subject__bar--weight' })}${
      item.mastery == null
        ? '<span class="incidence-subject__none">sem domínio medido</span>'
        : renderBulletBar({ value: Math.round(item.mastery), max: 100, label: `${item.name}: domínio médio ${Math.round(item.mastery)} de 100, em ${item.measured} tópicos`, unit: '/100', className: 'incidence-subject__bar incidence-subject__bar--mastery' })
    }</li>`;
  const first = subjects.slice(0, VISIBLE);
  const rest = subjects.slice(VISIBLE);
  return `<section class="performance-block incidence-subject" aria-label="Peso na prova e domínio por disciplina"><h3>Banca × você por disciplina</h3><p class="analytics-note">Peso na prova: parte das ${analyzedQuestionCount} questões da banca analisadas. Domínio: média dos tópicos com domínio medido, de 0 a 100. As duas escalas são diferentes.</p><div class="incidence-subject__head" aria-hidden="true"><span>Disciplina</span><span>Peso na prova</span><span>Seu domínio</span></div><ul class="incidence-subject__list">${first.map(line).join('')}</ul>${rest.length ? `<details class="performance-more"><summary>Mostrar mais · +${rest.length}</summary><ul class="incidence-subject__list">${rest.map(line).join('')}</ul></details>` : ''}</section>`;
}
