export function createEditalImportFacade({ catalog, importService }: any = {}) {
  if (!catalog || !importService) throw new TypeError('Edital facade requires catalog and service');
  let selection: Record<string, any> | null = null;
  return {
    presets: () => catalog,
    begin: (presetId: string) => {
      selection = catalog.find((item: any) => item.id === presetId) || null;
      return selection;
    },
    preview: (selectedSubjectIds?: Iterable<unknown>, selectedTopicIds?: Iterable<unknown>) =>
      selection
        ? importService.preview({ preset: selection, selectedSubjectIds, selectedTopicIds })
        : null,
    confirm: (selectedSubjectIds?: Iterable<unknown>, selectedTopicIds?: Iterable<unknown>) =>
      selection
        ? importService.importExamStructure({
            preset: selection,
            selectedSubjectIds,
            selectedTopicIds,
            duplicateStrategy: 'merge',
          })
        : null,
    cancel: () => {
      selection = null;
    },
  };
}
