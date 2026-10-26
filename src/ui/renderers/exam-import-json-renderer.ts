const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      (
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }) as Record<
          string,
          string
        >
      )[char]
  );

export function renderExamJsonPreview(
  parsed: Record<string, any>,
  preview: Record<string, any>,
  subjects: any[] = []
) {
  const subjectOptions = subjects
    .filter(item => !item.archived)
    .map(item => `<option value="${escape(item.id)}">${escape(item.name)}</option>`)
    .join('');
  const topicOptions = subjects
    .filter(item => !item.archived)
    .flatMap(subject =>
      (subject.topics || [])
        .filter((topic: any) => !topic.archived)
        .map(
          (topic: any) =>
            `<option value="${escape(subject.id)}|${escape(topic.id)}">${escape(subject.name)} — ${escape(topic.name)}</option>`
        )
    )
    .join('');
  const conflicts = preview.rows
    .filter((row: any) => row.status !== 'mapped')
    .map(
      (row: any) =>
        `<div class="exam-json-conflict" data-exam-row="${row.number}"><strong>Questão ${row.number}: ${escape(row.subject)} → ${escape(row.topic)}</strong><p>${row.status === 'subject-unresolved' ? 'Disciplina não encontrada.' : 'Tópico não encontrado.'} Escolha uma ação.</p><label>Ação<select data-exam-decision="${row.number}"><option value="">Revisar</option><option value="associate">Associar a tópico existente</option><option value="create">Criar tópico explicitamente</option><option value="ignore">Ignorar questão</option></select></label><label>Tópico existente<select data-exam-associate="${row.number}"><option value="">Selecione</option>${topicOptions}</select></label><label>Disciplina para criar tópico<select data-exam-create="${row.number}"><option value="">Selecione</option>${subjectOptions}</select></label></div>`
    )
    .join('');
  return `<div class="exam-json-preview"><p><strong>${escape(parsed.exam.institution)} · ${escape(parsed.exam.examName)} · ${parsed.exam.year}</strong> — ${escape(parsed.exam.board)}</p><p>${preview.rows.length} questões · ${preview.mappedCount} vinculadas · ${preview.unresolvedCount} precisam de decisão · ${preview.existingQuestionCount} já cadastradas nesta prova.</p><p>Cobertura declarada: <strong>${parsed.exam.coverage === 'complete' ? 'Completa' : 'Parcial'}</strong>. Questões ignoradas ficam pendentes de classificação e tornam a prova parcial até a revisão. ${parsed.exam.expectedQuestionCount == null ? 'O total oficial de questões não foi informado.' : `Total declarado: ${parsed.exam.expectedQuestionCount}.`}</p>${conflicts || '<p>Todas as questões foram vinculadas por nome.</p>'}<button class="btn" id="examJsonConfirm" type="button">Confirmar importação</button><button class="btn ghost" id="examJsonCancel" type="button">Cancelar</button></div>`;
}
