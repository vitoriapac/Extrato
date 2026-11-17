import { useState } from 'preact/hooks';
import type { StudyMaterial, StudyMaterialKind } from '../../core/types.js';
import {
  STUDY_MATERIAL_KINDS,
  STUDY_MATERIAL_KIND_LABELS,
  sanitizeMaterialUrl,
} from '../../domain/study-material.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

export interface TopicMaterialsSectionProps {
  materials: StudyMaterial[];
  onAddMaterial: (payload: {
    title: string;
    kind: StudyMaterialKind;
    url: string | null;
    isPrimary: boolean;
  }) => void;
  onSetPrimary?: (materialId: string) => void;
  onArchiveMaterial?: (materialId: string) => void;
}

export function TopicMaterialsSection({
  materials = [],
  onAddMaterial,
  onSetPrimary,
  onArchiveMaterial,
}: TopicMaterialsSectionProps) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<StudyMaterialKind>('pdf');
  const [url, setUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeMaterials = materials.filter(m => !m.archived);

  function handleSubmit(e: Event) {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Informe o título do material.');
      return;
    }
    const cleanUrl = url.trim() ? sanitizeMaterialUrl(url.trim()) : null;
    if (url.trim() && !cleanUrl) {
      setErrorMsg('URL inválida. Utilize um link http:// ou https://.');
      return;
    }

    setErrorMsg(null);
    onAddMaterial({
      title: cleanTitle,
      kind,
      url: cleanUrl,
      isPrimary: activeMaterials.length === 0,
    });
    setTitle('');
    setUrl('');
  }

  return (
    <section class="space-y-3 pt-2 border-t border-border-subtle" aria-label="Materiais do tópico">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted">
          Materiais do tópico
        </h4>
        <span class="text-xs text-muted">{activeMaterials.length} ativo(s)</span>
      </div>

      {activeMaterials.length > 0 && (
        <ul class="space-y-2">
          {activeMaterials.map(item => (
            <li
              key={item.id}
              class="rounded-lg border border-border-subtle bg-surface-subtle p-2.5 flex flex-wrap items-center justify-between gap-2"
            >
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium text-heading truncate">{item.title}</span>
                  <Badge variant={item.isPrimary ? 'info' : 'default'}>
                    {item.isPrimary ? 'Principal' : STUDY_MATERIAL_KIND_LABELS[item.kind]}
                  </Badge>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
                  >
                    <Icon name="external-link" size={12} />
                    Abrir material
                  </a>
                )}
              </div>

              <div class="flex items-center gap-1.5">
                {!item.isPrimary && onSetPrimary && (
                  <Button variant="ghost" size="small" onClick={() => onSetPrimary(item.id)}>
                    Definir principal
                  </Button>
                )}
                {onArchiveMaterial && (
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={`Arquivar ${item.title}`}
                    onClick={() => onArchiveMaterial(item.id)}
                  >
                    Arquivar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div class="sm:col-span-5">
          <label class="block text-xs text-muted mb-1" for="material-title-input">
            Título
          </label>
          <input
            id="material-title-input"
            type="text"
            value={title}
            onInput={e => setTitle((e.target as HTMLInputElement).value)}
            placeholder="Ex.: PDF Aula 03"
            class="w-full rounded-md border border-border-subtle bg-surface-elevated px-2.5 py-1.5 text-sm text-heading"
          />
        </div>
        <div class="sm:col-span-3">
          <label class="block text-xs text-muted mb-1" for="material-kind-select">
            Tipo
          </label>
          <select
            id="material-kind-select"
            value={kind}
            onChange={e => setKind((e.target as HTMLSelectElement).value as StudyMaterialKind)}
            class="w-full rounded-md border border-border-subtle bg-surface-elevated px-2.5 py-1.5 text-sm text-heading"
          >
            {STUDY_MATERIAL_KINDS.map(k => (
              <option key={k} value={k}>
                {STUDY_MATERIAL_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div class="sm:col-span-4">
          <label class="block text-xs text-muted mb-1" for="material-url-input">
            Link (https://)
          </label>
          <div class="flex gap-1.5">
            <input
              id="material-url-input"
              type="url"
              value={url}
              onInput={e => setUrl((e.target as HTMLInputElement).value)}
              placeholder="https://..."
              class="w-full rounded-md border border-border-subtle bg-surface-elevated px-2.5 py-1.5 text-sm text-heading"
            />
            <Button type="submit" variant="secondary" size="small">
              Adicionar
            </Button>
          </div>
        </div>
      </form>
      {errorMsg && <p class="text-xs text-red">{errorMsg}</p>}
    </section>
  );
}
