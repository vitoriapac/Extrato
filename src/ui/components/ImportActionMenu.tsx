import { DropdownMenu, type DropdownMenuItem } from '../primitives/dropdown-menu.js';

export interface ImportActionMenuProps {
  menuType: 'subjects' | 'questions';
}

const SUBJECTS_ITEMS: DropdownMenuItem[] = [
  {
    id: 'load-default-subjects',
    domId: 'loadDefaultSubjectsBtn',
    label: 'Carregar disciplinas do edital',
    dataAttrs: { 'data-testid': 'open-exam-import' },
  },
  {
    id: 'structured-content-import',
    domId: 'structuredContentImportBtn',
    label: 'Importar JSON ou CSV',
    icon: 'file-import',
  },
  {
    id: 'download-structured-csv',
    domId: 'downloadStructuredCsvBtn',
    label: 'Baixar modelo CSV',
    icon: 'download',
  },
];

const QUESTIONS_ITEMS: DropdownMenuItem[] = [
  {
    id: 'import-questions',
    domId: 'importQuestionsBtn',
    label: 'Importar CSV (QConcursos / Tec / Padrão)',
    icon: 'file-import',
  },
  {
    id: 'download-questions-csv',
    domId: 'downloadQuestionsCsvBtn',
    label: 'Baixar modelo CSV',
    icon: 'download',
  },
];

export function ImportActionMenu({ menuType }: ImportActionMenuProps) {
  if (menuType === 'subjects') {
    return (
      <DropdownMenu
        items={SUBJECTS_ITEMS}
        keepMounted
        placement="bottom-end"
        className="subjects-import-menu"
        triggerId="subjectsImportMenuTrigger"
        triggerVariant="secondary"
        triggerSize="default"
        triggerLabel="Importar"
        triggerAriaLabel="Opções de importação de disciplinas"
        triggerIcon="file-import"
        triggerRightIcon="chevron-down"
        menuAriaLabel="Opções de importação de disciplinas"
      />
    );
  }

  return (
    <DropdownMenu
      items={QUESTIONS_ITEMS}
      keepMounted
      placement="bottom-end"
      className="questions-import-menu"
      triggerId="questionsImportMenuTrigger"
      triggerVariant="secondary"
      triggerSize="default"
      triggerLabel="Importar"
      triggerAriaLabel="Opções de importação de questões"
      triggerIcon="file-import"
      triggerRightIcon="chevron-down"
      menuAriaLabel="Opções de importação de questões"
    />
  );
}
