export function createApplicationRenderer({
  sections = [],
  scopes = {},
  globalSections = [],
  getActiveScope = (): string | null => null,
  afterRender = () => {},
  onError = () => {},
}: any = {}) {
  const globals = new Set(globalSections);
  const render = (scope = 'all') => {
    const selected = scope === 'all' ? null : scopes[scope === 'active' ? getActiveScope() : scope];
    sections
      .filter(
        ([name]: [string, () => void]) => !selected || globals.has(name) || selected.has(name)
      )
      .forEach(([name, renderer]: [string, () => void]) => {
        try {
          renderer();
        } catch (error) {
          onError(error, name);
        }
      });
    afterRender();
    return scope;
  };
  return Object.freeze({ render });
}
