export function collectHistoricalExamImportDecisions(
  preview: Record<string, any>,
  container: ParentNode
) {
  const decisions: Record<string, any> = {};
  for (const row of preview.rows.filter((item: any) => item.status !== 'mapped')) {
    const field = container.querySelector<HTMLSelectElement>(
      `[data-exam-decision="${row.number}"]`
    );
    const action = field?.value;
    if (!action) throw new TypeError(`Questão ${row.number}: escolha associar, criar ou ignorar.`);
    if (action === 'associate') {
      const [subjectId, topicId] = (
        container.querySelector<HTMLSelectElement>(`[data-exam-associate="${row.number}"]`)
          ?.value || ''
      ).split('|');
      decisions[row.number] = { action, subjectId, topicId };
    } else if (action === 'create') {
      const subjectId = container.querySelector<HTMLSelectElement>(
        `[data-exam-create="${row.number}"]`
      )?.value;
      decisions[row.number] = { action, subjectId };
    } else decisions[row.number] = { action };
  }
  return decisions;
}
