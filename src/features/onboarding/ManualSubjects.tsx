import { Button } from '../../ui/primitives/button.js';
import type { ManualSubjectDraft } from '../../application/onboarding/manual-subject-drafts.js';

export function ManualSubjects({ drafts, onChange }: {
  drafts: ManualSubjectDraft[];
  onChange: (drafts: ManualSubjectDraft[]) => void;
}) {
  const update = (index: number, change: Partial<ManualSubjectDraft>) =>
    onChange(drafts.map((item, i) => i === index ? { ...item, ...change } : item));
  return <section class="grid gap-4 min-w-0 max-w-full border-t border-border-default pt-4" aria-label="Cadastro manual de matérias">
    <p class="text-sm text-content-secondary m-0">Revise as matérias abaixo. Elas serão adicionadas ao continuar; o plano será criado somente na confirmação final.</p>
    {drafts.map((subject, index) => <fieldset key={index} class="grid gap-3 min-w-0 max-w-full border border-border-default p-3 rounded-default">
      <legend>Disciplina {index + 1}</legend>
      <label class="grid gap-1 min-w-0">Nome da disciplina<input class="w-full min-w-0" value={subject.name} onInput={event => update(index, { name: event.currentTarget.value })} /></label>
      {subject.topics.map((topic, topicIndex) => <div key={topicIndex} class="flex flex-wrap items-end gap-2 min-w-0">
        <label class="flex-1 min-w-[160px] grid gap-1">Tópico {topicIndex + 1}<input class="w-full min-w-0" value={topic} onInput={event => update(index, { topics: subject.topics.map((value, i) => i === topicIndex ? event.currentTarget.value : value) })} /></label>
        {subject.topics.length > 1 && <Button variant="ghost" size="small" aria-label={`Remover tópico ${topicIndex + 1} da disciplina ${index + 1}`} onClick={() => update(index, { topics: subject.topics.filter((_, i) => i !== topicIndex) })}>Remover</Button>}
      </div>)}
      <div class="flex flex-wrap gap-2"><Button variant="ghost" size="small" onClick={() => update(index, { topics: [...subject.topics, ''] })}>Adicionar outro tópico</Button><Button variant="ghost" size="small" onClick={() => onChange(drafts.filter((_, i) => i !== index))}>Remover disciplina {index + 1}</Button></div>
    </fieldset>)}
    <Button variant="secondary" size="small" onClick={() => onChange([...drafts, { name: '', topics: [''] }])}>Adicionar outra disciplina</Button>
  </section>;
}
