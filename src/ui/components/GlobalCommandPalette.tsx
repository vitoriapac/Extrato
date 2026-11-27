import type { JSX } from 'preact';
import type {
  SearchCommand,
  SearchRecordItem,
  SearchResultItem,
} from '../controllers/search-controller.js';
import type { IconName } from '../primitives/icon.js';
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
} from '../primitives/command-palette.js';

export interface GlobalCommandPaletteProps {
  open: boolean;
  query: string;
  actionCommands: SearchCommand[];
  navCommands: SearchCommand[];
  topics: SearchResultItem[];
  records?: SearchRecordItem[];
  onSelectRecord?: (id: string) => void;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onExecuteCommand: (command: SearchCommand) => void;
  onSelectTopic: (subjectId: string, topicId: string) => void;
}

export function GlobalCommandPalette({
  open,
  query,
  actionCommands,
  navCommands,
  topics,
  records = [],
  onSelectRecord,
  onOpenChange,
  onQueryChange,
  onExecuteCommand,
  onSelectTopic,
}: GlobalCommandPaletteProps): JSX.Element {
  const hasResults =
    actionCommands.length > 0 || navCommands.length > 0 || topics.length > 0 || records.length > 0;
  const trimmedQuery = query.trim();

  return (
    <CommandPalette
      dialogId="globalCommandPaletteDialog"
      inputId="globalSearchInput"
      listboxId="globalSearchResults"
      statusId="globalSearchStatus"
      listClassName={open ? 'search-results show' : 'search-results'}
      autoSelectFirst={trimmedQuery.length > 0}
      size="lg"
      enableHotkey={true}
      label="Busca global e paleta de comandos"
      open={open}
      query={query}
      onOpenChange={onOpenChange}
      onQueryChange={onQueryChange}
    >
      <CommandPaletteInput
        placeholder="O que você quer fazer?"
        ariaLabel="Buscar ações, páginas, tópicos, notas, tags ou simulados"
        clearLabel="Limpar busca"
        showCloseButton={true}
        closeLabel="Fechar paleta de busca"
      />
      <CommandPaletteList label="Resultados e comandos">
        {actionCommands.length > 0 && (
          <CommandPaletteGroup heading="Ações">
            {actionCommands.map(cmd => (
              <CommandPaletteItem
                key={`action-${cmd.action}-${cmd.label}`}
                value={`action:${cmd.action}:${cmd.label}`}
                label={cmd.label}
                icon={(cmd.icon || 'bolt') as IconName}
                forceMount
                className="search-result-item search-command"
                onSelect={() => onExecuteCommand(cmd)}
              />
            ))}
          </CommandPaletteGroup>
        )}
        {navCommands.length > 0 && (
          <CommandPaletteGroup heading="Navegação">
            {navCommands.map(cmd => (
              <CommandPaletteItem
                key={`nav-${cmd.tab}-${cmd.label}`}
                value={`tab:${cmd.tab}:${cmd.label}`}
                label={cmd.label}
                icon={(cmd.icon || 'compass') as IconName}
                forceMount
                className="search-result-item search-command"
                onSelect={() => onExecuteCommand(cmd)}
              />
            ))}
          </CommandPaletteGroup>
        )}
        {topics.length > 0 && (
          <CommandPaletteGroup heading="Tópicos">
            {topics.map(topic => (
              <CommandPaletteItem
                key={`topic-${topic.subjectId}-${topic.topicId}`}
                value={`topic:${topic.subjectId}:${topic.topicId}`}
                label={topic.topicName}
                description={topic.subjectName}
                forceMount
                leading={
                  <span
                    class={`command-palette-topic-swatch subject-bg-${topic.colorSlot || 1}`}
                    aria-hidden="true"
                  />
                }
                className="search-result-item search-topic"
                onSelect={() => onSelectTopic(topic.subjectId, topic.topicId)}
              />
            ))}
          </CommandPaletteGroup>
        )}
        {records.length > 0 && (
          <CommandPaletteGroup heading="Simulados registrados">
            {records.map(record => (
              <CommandPaletteItem
                key={`record-${record.id}`}
                value={`record:${record.id}`}
                label={record.label}
                description={record.description}
                icon="clipboard-text"
                forceMount
                className="search-result-item search-record"
                onSelect={() => onSelectRecord?.(record.id)}
              />
            ))}
          </CommandPaletteGroup>
        )}
        {!hasResults && (
          <CommandPaletteEmpty icon="search" alwaysRender>
            <span>
              Nada encontrado para &ldquo;{trimmedQuery || query}&rdquo;. Tente uma palavra mais
              curta ou o nome de uma aba.
            </span>
            <button
              type="button"
              class="btn ghost small mt-2"
              onClick={() =>
                onExecuteCommand({
                  label: 'Abrir Instruções',
                  keywords: 'instrucoes ajuda',
                  tab: 'instrucoes',
                  icon: 'help-circle',
                })
              }
            >
              Abrir Instruções
            </button>
          </CommandPaletteEmpty>
        )}
      </CommandPaletteList>
      <CommandPaletteFooter />
    </CommandPalette>
  );
}
