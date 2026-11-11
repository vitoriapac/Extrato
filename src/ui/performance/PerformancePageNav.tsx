import type { JSX } from 'preact';
import { Tabs, type TabItem } from '../primitives/tabs.js';

export interface PerformanceGroupDef {
  key: string;
  label: string;
  items: ReadonlyArray<[string, string]>;
}

export const PERFORMANCE_GROUPS: ReadonlyArray<PerformanceGroupDef> = [
  { key: 'overview', label: 'Visão geral', items: [['overview', 'Visão geral']] },
  {
    key: 'subjects',
    label: 'Disciplinas',
    items: [
      ['subjects', 'Por disciplina'],
      ['diagnosis', 'Diagnóstico'],
    ],
  },
  {
    key: 'proofs',
    label: 'Questões e provas',
    items: [
      ['questions', 'Questões'],
      ['simulations', 'Simulados'],
      ['exam', 'Inteligência da prova'],
    ],
  },
  {
    key: 'consistency',
    label: 'Consistência',
    items: [
      ['consistency', 'Ritmo e aderência'],
      ['history', 'Conquistas e histórico'],
    ],
  },
];

export function performanceGroupOf(section: string): string | null {
  return (
    PERFORMANCE_GROUPS.find(group => group.items.some(([key]) => key === section))?.key ?? null
  );
}

export interface PerformancePageNavProps {
  activeSection: string;
  onSelectSection?: (section: string) => void;
}

export function PerformancePageNav({
  activeSection,
  onSelectSection,
}: PerformancePageNavProps): JSX.Element {
  const activeGroup =
    PERFORMANCE_GROUPS.find(group => group.items.some(([key]) => key === activeSection)) ||
    PERFORMANCE_GROUPS[0];

  const primaryItems: TabItem[] = PERFORMANCE_GROUPS.map(group => {
    if (group.items.length === 1) {
      const [sectionKey] = group.items[0];
      const active = activeSection === sectionKey;
      return {
        id: group.key,
        label: group.label,
        tabId: `performanceTab-${sectionKey}`,
        className: `performance-section-button${active ? ' active' : ''}`,
        buttonProps: {
          'data-performance-section': sectionKey,
          'aria-controls': 'performanceSectionContent',
        },
      };
    }

    const active = activeGroup.key === group.key;
    const firstSection = group.items[0][0];
    return {
      id: group.key,
      label: group.label,
      tabId: `performanceGroupTab-${group.key}`,
      className: `performance-section-button performance-group-button${active ? ' active' : ''}`,
      buttonProps: {
        'data-performance-group': group.key,
        'data-performance-group-target': firstSection,
        'aria-controls': active ? `performanceSubnav-${group.key}` : undefined,
      },
    };
  });

  const secondaryItems: TabItem[] =
    activeGroup.items.length > 1
      ? activeGroup.items.map(([key, label]) => ({
          id: key,
          label,
          tabId: `performanceTab-${key}`,
          className: `performance-section-button${activeSection === key ? ' active' : ''}`,
          buttonProps: {
            'data-performance-section': key,
            'aria-controls': 'performanceSectionContent',
          },
        }))
      : [];

  return (
    <div class="performance-nav-stack" data-performance-nav="true">
      <Tabs
        label="Análises de desempenho"
        variant="underline"
        value={activeGroup.key}
        onValueChange={nextGroupKey => {
          const targetGroup = PERFORMANCE_GROUPS.find(group => group.key === nextGroupKey);
          if (targetGroup) {
            onSelectSection?.(targetGroup.items[0][0]);
          }
        }}
        listProps={{ className: 'performance-section-nav' }}
        items={primaryItems}
      />
      {secondaryItems.length > 0 && (
        <Tabs
          key={`subnav-${activeGroup.key}`}
          label={`Seções de ${activeGroup.label}`}
          variant="contained"
          value={activeSection}
          onValueChange={nextSection => onSelectSection?.(nextSection)}
          listProps={{
            id: `performanceSubnav-${activeGroup.key}`,
            className: 'performance-subsection-nav',
          }}
          items={secondaryItems}
        />
      )}
    </div>
  );
}
