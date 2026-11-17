import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { formatPlanMinutes } from '../../core/format-duration.js';
import type { StudyCycleBlock } from '../../domain/planning/study-cycle-engine.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

export interface StudyCycleBlockListProps {
  blocks: StudyCycleBlock[];
  isManualMode: boolean;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  onEnableManualMode?: () => void;
  maxVisible?: number;
  showAll?: boolean;
  onToggleShowAll?: () => void;
}

export function StudyCycleBlockList({
  blocks,
  isManualMode,
  onMoveBlock,
  onEnableManualMode,
  maxVisible,
  showAll = true,
  onToggleShowAll,
}: StudyCycleBlockListProps): JSX.Element | null {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const visibleBlocks =
    !showAll && typeof maxVisible === 'number' ? blocks.slice(0, maxVisible) : blocks;

  return (
    <div class="space-y-2">
      <ul
        class="m-0 p-0 list-none max-h-60 overflow-y-auto divide-y divide-border-subtle border-t border-b border-border-subtle"
        aria-label="Sequência de blocos do ciclo"
      >
        {visibleBlocks.map((block, index) => {
          const isDropTarget = isManualMode && dragOverIndex === index && dragIndex !== index;
          return (
            <li
              key={block.id}
              draggable={isManualMode}
              onDragStart={e => {
                if (!isManualMode) return;
                setDragIndex(index);
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(index));
                }
              }}
              onDragOver={e => {
                if (!isManualMode) return;
                e.preventDefault();
                if (dragOverIndex !== index) setDragOverIndex(index);
              }}
              onDragLeave={() => {
                if (dragOverIndex === index) setDragOverIndex(null);
              }}
              onDrop={e => {
                if (!isManualMode) return;
                e.preventDefault();
                const from =
                  dragIndex !== null
                    ? dragIndex
                    : Number(e.dataTransfer?.getData('text/plain') ?? NaN);
                setDragIndex(null);
                setDragOverIndex(null);
                if (Number.isInteger(from) && from >= 0 && from < blocks.length && from !== index) {
                  onMoveBlock(from, index);
                }
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              class={`flex items-center justify-between gap-2 py-2 ${
                isManualMode ? 'cursor-grab' : ''
              } ${isDropTarget ? 'bg-surface-subtle' : ''}`}
            >
              <span class="flex items-center gap-2 min-w-0 truncate text-content-primary">
                {isManualMode && (
                  <Icon
                    name="grip-vertical"
                    size={14}
                    class="text-content-secondary shrink-0"
                  />
                )}
                <span class="truncate">
                  <span class="font-data text-content-secondary">{index + 1}.</span>{' '}
                  <strong>{block.subjectName}</strong> ·{' '}
                  <span class="font-data">{formatPlanMinutes(block.durationMinutes)}</span>
                </span>
              </span>

              {isManualMode && (
                <label class="inline-flex items-center gap-2 shrink-0">
                  <span class="sr-only">{`Posição de ${block.subjectName}`}</span>
                  <select
                    class="select-control font-data text-xs py-1 px-2"
                    aria-label={`Posição de ${block.subjectName} (${index + 1} de ${blocks.length})`}
                    value={index}
                    onChange={e => {
                      const targetIndex = Number(e.currentTarget.value);
                      if (Number.isInteger(targetIndex) && targetIndex !== index) {
                        onMoveBlock(index, targetIndex);
                      }
                    }}
                  >
                    {blocks.map((_, pos) => (
                      <option key={pos} value={pos}>
                        {`${pos + 1}º`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </li>
          );
        })}
      </ul>

      <div class="flex flex-wrap items-center gap-4">
        {typeof maxVisible === 'number' &&
          blocks.length > maxVisible &&
          onToggleShowAll && (
            <Button
              variant="tertiary"
              size="small"
              aria-expanded={showAll}
              onClick={onToggleShowAll}
            >
              {showAll ? 'Recolher blocos' : `Mostrar todos os ${blocks.length} blocos`}
            </Button>
          )}

        {!isManualMode && onEnableManualMode && (
          <Button variant="tertiary" size="small" onClick={onEnableManualMode}>
            Personalizar ordem (modo Manual)
          </Button>
        )}
      </div>
    </div>
  );
}
