export interface MasterRendererOptions {
  applicationRenderer: {
    render: (scope?: string) => any;
  };
  getActiveTabName: () => string;
  renderStudyTrack32Insights?: () => void;
  errorBoundary?: {
    report: (error: unknown, name: string) => void;
  };
  scheduleSave?: () => void;
  onRenderStart?: () => void;
  onRenderFinish?: () => void;
}

export interface MasterRenderer {
  render: (scope?: string) => any;
  renderScope: (scope?: string) => any;
  persistAndRender: () => void;
  renderAll: () => any;
  isRendering: () => boolean;
  getDepth: () => number;
}

export function createMasterRenderer({
  applicationRenderer,
  getActiveTabName,
  renderStudyTrack32Insights,
  errorBoundary,
  scheduleSave,
  onRenderStart,
  onRenderFinish,
}: MasterRendererOptions): MasterRenderer {
  let renderDepth = 0;

  function renderScope(scope: string = 'all') {
    const result = applicationRenderer.render(scope);
    const activeTab = getActiveTabName();
    if (
      scope === 'all' ||
      scope === 'dashboard' ||
      scope === 'metas' ||
      (scope === 'active' && (activeTab === 'dashboard' || activeTab === 'metas'))
    ) {
      try {
        renderStudyTrack32Insights?.();
      } catch (error) {
        errorBoundary?.report(error, 'análises estratégicas');
      }
    }
    return result;
  }

  function render(scope: string = 'all') {
    renderDepth++;
    if (renderDepth === 1) {
      onRenderStart?.();
    }
    try {
      return renderScope(scope);
    } finally {
      renderDepth--;
      if (renderDepth === 0) {
        onRenderFinish?.();
      }
    }
  }

  function persistAndRender() {
    render('active');
    scheduleSave?.();
  }

  function renderAll() {
    return render('all');
  }

  function isRendering() {
    return renderDepth > 0;
  }

  function getDepth() {
    return renderDepth;
  }

  return Object.freeze({
    render,
    renderScope,
    persistAndRender,
    renderAll,
    isRendering,
    getDepth,
  });
}
