import { buildExamCountImport } from '../../application/exam-intelligence/import-exam-json.js';

const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    char =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] as string
  );

/** Prova anterior sem JSON: o aluno conta as questões por tópico e registra aqui. */
type Entity = { id: string; name: string; archived?: boolean };
type CountState = {
  subjects?: (Entity & { topics?: Entity[] })[];
  exams?: Record<string, unknown>[];
  examQuestions?: Record<string, unknown>[];
  examBlueprint?: { banca?: string | null; activeExamTags?: string[] };
};
interface ExamCountDeps {
  document: Document;
  getState: () => CountState;
  onImported: (result: ReturnType<typeof buildExamCountImport>) => void;
  notify: (message: string) => void;
}

export function createExamCountController({
  document,
  getState,
  onImported,
  notify,
}: ExamCountDeps) {
  const start = document.getElementById('examCountStart');
  const container = document.getElementById('examCountForm');
  if (!start || !container) return { mount() {} };

  const render = () => {
    const state = getState();
    const subjects = (state.subjects || []).filter(
      subject => !subject.archived && subject.topics?.some(topic => !topic.archived)
    );
    if (!subjects.length) {
      container.innerHTML =
        '<p class="analytics-note">Cadastre as disciplinas e os tópicos do edital antes de contar uma prova.</p>';
      return;
    }
    const groups = subjects
      .map(
        subject =>
          `<details class="exam-count-subject"><summary>${escape(subject.name)}</summary><div class="exam-count-topics">${(
            subject.topics || []
          )
            .filter(topic => !topic.archived)
            .map(
              topic =>
                `<label><span>${escape(topic.name)}</span><input type="number" inputmode="numeric" min="0" max="200" step="1" placeholder="0" data-exam-count="${escape(subject.id)}|${escape(topic.id)}"></label>`
            )
            .join('')}</div></details>`
      )
      .join('');
    container.innerHTML = `<form class="exam-count" novalidate><div class="exam-count-meta"><label>Instituição<input id="examCountInstitution" required maxlength="300" placeholder="Ex.: Banco do Brasil"></label><label>Cargo<input id="examCountRole" required maxlength="300" placeholder="Ex.: Escriturário"></label><label>Banca<input id="examCountBoard" required maxlength="200" value="${escape(state.examBlueprint?.banca || '')}"></label><label>Ano<input id="examCountYear" type="number" inputmode="numeric" required min="1990" max="2100"></label><label>Total de questões da prova <small>(opcional)</small><input id="examCountTotal" type="number" inputmode="numeric" min="1" max="10000"></label></div><p class="analytics-note">Abra cada disciplina e informe quantas questões caíram em cada tópico. Tópico sem questão fica em branco.</p>${groups}<p id="examCountSum" role="status">Nenhuma questão contada.</p><button class="btn" type="submit">Registrar prova</button> <button class="btn ghost" type="button" id="examCountCancel">Cancelar</button></form>`;
  };

  const counts = () =>
    [...container.querySelectorAll<HTMLInputElement>('[data-exam-count]')].map(input => {
      const [subjectId, topicId] = (input.dataset.examCount || '').split('|');
      return { subjectId, topicId, count: input.value };
    });
  const value = (id: string) =>
    (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

  const onInput = (event: Event) => {
    if (!(event.target as HTMLElement).matches?.('[data-exam-count]')) return;
    const sum = counts().reduce((total, item) => total + (Math.floor(Number(item.count)) || 0), 0);
    const label = document.getElementById('examCountSum');
    if (label)
      label.textContent = sum
        ? `${sum} ${sum === 1 ? 'questão contada' : 'questões contadas'}.`
        : 'Nenhuma questão contada.';
  };
  const onClick = (event: Event) => {
    if ((event.target as HTMLElement).id !== 'examCountCancel') return;
    container.innerHTML = '';
    start.focus();
  };
  const onSubmit = (event: Event) => {
    event.preventDefault();
    const state = getState();
    try {
      const result = buildExamCountImport(
        {
          institution: value('examCountInstitution'),
          role: value('examCountRole'),
          board: value('examCountBoard'),
          year: value('examCountYear'),
          totalQuestions: value('examCountTotal'),
        },
        counts(),
        state,
        state.examBlueprint?.activeExamTags || []
      );
      onImported(result);
      const message =
        `${result.replaced ? 'Contagem substituída' : 'Prova registrada'}: ${result.counted} questões. ` +
        (result.coverage === 'complete'
          ? 'Ela já entra na incidência.'
          : `Faltam ${result.missing} questões para fechar a prova; só provas completas entram na incidência.`);
      container.innerHTML = `<aside class="context-note context-note--success" role="status"><strong>${escape(result.replaced ? 'Contagem substituída' : 'Prova registrada')}</strong><p>${escape(message)}</p></aside>`;
      notify(message);
    } catch (error) {
      notify(
        (error as Error).message || 'Não foi possível registrar a prova. Nenhum dado foi alterado.'
      );
    }
  };

  return {
    mount() {
      start.addEventListener('click', render);
      container.addEventListener('input', onInput);
      container.addEventListener('click', onClick);
      container.addEventListener('submit', onSubmit);
    },
  };
}
