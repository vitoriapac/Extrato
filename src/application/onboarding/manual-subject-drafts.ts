export interface ManualSubjectDraft {
  name: string;
  topics: string[];
}

export function validateManualSubjects(drafts: ManualSubjectDraft[], existingNames: string[] = []): string {
  if (drafts.some(subject => !subject.name.trim())) return 'Informe o nome de cada disciplina.';
  if (drafts.some(subject => !subject.topics.length || subject.topics.some(topic => !topic.trim())))
    return 'Informe o nome de cada tópico ou remova o campo vazio.';
  const names = new Set(existingNames.map(name => name.trim().toLocaleLowerCase('pt-BR')));
  for (const draft of drafts) {
    const name = draft.name.trim().toLocaleLowerCase('pt-BR');
    if (names.has(name)) return 'Já existe uma disciplina com esse nome.';
    names.add(name);
  }
  return '';
}
