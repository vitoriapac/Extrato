import type { JSX } from 'preact';
import type { SearchCommand, SearchResultItem } from '../controllers/search-controller.js';
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
  onOpenChange,
  onQueryChange,
  onExecuteCommand,
  onSelectTopic,
}: GlobalCommandPaletteProps): JSX.Element {
  const hasResults = actionCommands.length > 0 || navCommands.length > 0 || topics.length > 0;
  const trimmedQuery = query.trim();

  return (
    <CommandPalette
      dialogId="globalCommandPaletteDialog"
      inputId="globalSearchInput"
      listboxId="globalSearchResults"
      statusId="globalSearchStatus"
      listClassName={open ? 'search-results show' : 'search-results'}
      autoSelectFirst={false}
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
        ariaLabel="Buscar ações, páginas, tópicos, notas ou tags"
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
                trailing={
                  <span class="command-palette-badge command-badge-action" aria-hidden="true">
                    Ação
                  </span>
                }
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
                trailing={
                  <span class="command-palette-badge command-badge-nav" aria-hidden="true">
                    Navegação
                  </span>
                }
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
        {!hasResults && (
          <CommandPaletteEmpty icon="search" alwaysRender>
            Nada encontrado para &ldquo;{trimmedQuery || query}&rdquo;. Tente uma palavra mais curta
            ou o nome de uma aba; a Central de Ajuda fica em Instruções.
          </CommandPaletteEmpty>
        )}
      </CommandPaletteList>
      <CommandPaletteFooter />
    </CommandPalette>
  );
}
