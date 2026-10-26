export const normalizeSubjectSearch = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export function matchesSubjectSearch(
  subject: { name?: string },
  topic: { name?: string } | null | undefined,
  query: string
) {
  const terms = normalizeSubjectSearch(query).split(/\s+/).filter(Boolean),
    text = normalizeSubjectSearch(subject.name + ' ' + (topic?.name || ''));
  return terms.every(term => text.includes(term));
}
export function createSubjectSearchController({
  document,
  onChange,
}: {
  document: Document;
  onChange: () => void;
}) {
  let query = '';
  document.addEventListener('input', (event: any) => {
    if (event.target.id !== 'subjectContentSearch') return;
    query = event.target.value;
    const position = event.target.selectionStart;
    onChange();
    const input = document.getElementById('subjectContentSearch') as HTMLInputElement | null;
    input?.focus({ preventScroll: true });
    input?.setSelectionRange(position, position);
  });
  return {
    get query() {
      return query;
    },
  };
}
