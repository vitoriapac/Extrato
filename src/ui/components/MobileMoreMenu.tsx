import { DropdownMenu, type DropdownMenuItem } from '../primitives/dropdown-menu.js';
import { Icon, type IconName } from '../primitives/icon.js';

export interface MobileMoreMenuProps {
  activeTab: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTab: (tabName: string) => void;
}

const SECONDARY_TABS: ReadonlyArray<{ id: string; label: string; icon: IconName }> = [
  { id: 'disciplinas', label: 'Disciplinas', icon: 'books' },
  { id: 'questoes', label: 'Questões e Simulados', icon: 'list-check' },
  { id: 'metas', label: 'Planejamento', icon: 'map-2' },
  { id: 'instrucoes', label: 'Instruções', icon: 'help-circle' },
];

export function MobileMoreMenu({
  activeTab,
  open,
  onOpenChange,
  onSelectTab,
}: MobileMoreMenuProps) {
  const isSecondaryActive = SECONDARY_TABS.some(tab => tab.id === activeTab);

  const items: DropdownMenuItem[] = SECONDARY_TABS.map(tab => {
    const active = activeTab === tab.id;
    return {
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      active,
      ariaCurrent: active ? 'page' : undefined,
      dataAttrs: { 'data-more-tab': tab.id },
      onSelect: () => onSelectTab(tab.id),
    };
  });

  return (
    <>
      {open && <div class="mobile-more-scrim" aria-hidden="true" />}
      <DropdownMenu
        items={items}
        open={open}
        onOpenChange={onOpenChange}
        keepMounted
        restoreFocusOnSelect={false}
        placement="top-end"
        className="mobile-more-menu-popover"
        triggerVariant="unstyled"
        triggerId="moreTabButton"
        triggerClassName={isSecondaryActive ? 'tab-btn more-tab-btn active' : 'tab-btn more-tab-btn'}
        triggerContent={
          <>
            <Icon name="dots" size={16} class="tab-icon" />
            <span class="tab-label">Mais</span>
          </>
        }
        menuId="mobileMoreMenu"
        menuAriaLabel="Mais seções do extrato"
        menuClassName="mobile-more-menu"
      />
    </>
  );
}
