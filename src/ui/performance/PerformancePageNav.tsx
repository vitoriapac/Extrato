import type { JSX } from 'preact';
import { Tabs, type TabItem } from '../primitives/tabs.js';

export interface PerformanceGroupDef {
  key: string;
  label: string;
  items: ReadonlyArray<[string, string]>;
  /** Seções que moram na mesma página do item único (Resultados das provas: questões, simulados e inteligência da prova). */
  alsoSections?: ReadonlyArray<string>;
}

export const PERFORMANCE_GROUPS: ReadonlyArray<PerformanceGroupDef> = [
  { key: 'overview', label: 'Resumo', items: [['overview', 'Resumo']] },
  { key: 'subjects', label: 'Por disciplina', items: [['subjects', 'Por disciplina']] },
  { key: 'diagnosis', label: 'Diagnóstico', items: [['diagnosis', 'Diagnóstico']] },
  {
    key: 'proofs',
    label: 'Resultados das provas',
    items: [['questions', 'Resultados das provas']],
    alsoSections: ['simulations', 'exam'],
  },
  { key: 'consistency', label: 'Ritmo e aderência', items: [['consistency', 'Ritmo e aderência']] },
];

const groupHas = (group: PerformanceGroupDef, section: string) =>
  group.items.some(([key]) => key === section) || Boolean(group.alsoSections?.includes(section));

export function performanceGroupOf(section: string): string | null {
  return PERFORMANCE_GROUPS.find(group => groupHas(group, section))?.key ?? null;
}

export interface PerformancePageNavProps {
  activeSection: string;
  onSelectSection?: (section: string) => void;
}

// Última subseção vista em cada grupo: voltar ao grupo não manda para o primeiro item.
const lastSectionByGroup = new Map<string, string>();

export function PerformancePageNav({
  activeSection,
  onSelectSection,
}: PerformancePageNavProps): JSX.Element {
  const activeGroup =
    PERFORMANCE_GROUPS.find(group => groupHas(group, activeSection)) ||
    PERFORMANCE_GROUPS[0];
  lastSectionByGroup.set(activeGroup.key, activeSection);

  const primaryItems: TabItem[] = PERFORMANCE_GROUPS.map(group => {
    if (group.items.length === 1) {
      const [sectionKey] = group.items[0];
      const active = groupHas(group, activeSection);
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
            const remembered = lastSectionByGroup.get(targetGroup.key);
            const isValid = targetGroup.items.some(([key]) => key === remembered);
            onSelectSection?.(isValid && remembered ? remembered : targetGroup.items[0][0]);
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
