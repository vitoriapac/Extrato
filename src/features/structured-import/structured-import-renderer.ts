const safe = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      (
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as Record<
          string,
          string
        >
      )[char]
  );
export function renderStructuredImport(model: Record<string, any>) {
  if (model.issues.length)
    return `<div class="structured-import-error"><h4>Não foi possível importar o arquivo.</h4><p>${model.issues.length} ${model.issues.length === 1 ? 'problema encontrado' : 'problemas encontrados'}:</p><ol>${model.issues.map((item: any) => `<li>${item.line ? `Linha ${item.line} — ` : ''}${safe(item.message)}</li>`).join('')}</ol></div>`;
  const p = model.preview,
    counts = p?.fieldUpdates || {};
  return `<div class="structured-import-preview"><p class="structured-file"><strong>Arquivo:</strong> ${safe(model.fileName)}</p><div class="study-plan-summary"><div><strong>${model.subjectCount}</strong><span>disciplinas</span></div><div><strong>${model.topicCount}</strong><span>tópicos</span></div><div><strong>+${p.addedSubjects}</strong><span>novas disciplinas</span></div><div><strong>+${p.addedTopics}</strong><span>novos tópicos</span></div></div><div class="structured-import-counts"><section><h4>Existentes</h4><p>${p.existingSubjects} disciplinas · ${p.existingTopics} tópicos</p></section><section><h4>Atualizações</h4><p>${counts.difficulty} dificuldades · ${counts.examImportance} importâncias · ${counts.estimatedStudyMinutes} esforços · ${counts.tags} tags</p></section><section><h4>Preservados</h4><p>${p.preservedTopics} tópicos sem alteração · IDs e histórico mantidos</p></section></div>${
    p.conflicts.length
      ? `<details class="structured-conflicts"><summary>Ver conflitos e preservações (${p.conflicts.length})</summary>${p.conflicts
          .slice(0, 20)
          .map(
            (item: any) =>
              `<article><strong>${safe(item.subjectName)} — ${safe(item.topicName)}</strong><span>Status: já existe</span><small>Preservado: ${item.stablePreserved.join(', ')}</small>${item.preserved.length ? `<small>${item.preserved.map((field: any) => `${safe(field.label)} manual preservada`).join(' · ')}</small>` : ''}${item.updates.length ? `<small>Pode atualizar: ${item.updates.map((field: any) => safe(field.label)).join(', ')}</small>` : ''}</article>`
          )
          .join('')}</details>`
      : ''
  }</div>`;
}
