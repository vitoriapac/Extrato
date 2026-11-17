import { mountPreact, unmountPreact } from '../../ui/preact-mount.js';
import type { StudyMaterial, StudyMaterialKind } from '../../core/types.js';
import {
  archiveStudyMaterial,
  createStudyMaterial,
  setPrimaryStudyMaterial,
} from '../../domain/study-material.js';
import { TopicMaterialsSection } from '../../ui/components/TopicMaterialsSection.js';
import { TopicIntelligenceView } from './topic-intelligence-view.js';
import type { TopicIntelligenceViewModel } from './topic-intelligence-view-model.js';

export interface MountTopicIntelligenceModalOptions {
  container: HTMLElement;
  viewModel: TopicIntelligenceViewModel | null;
  getMaterials: (subjectId: string, topicId: string) => StudyMaterial[];
  onUpdateMaterials: (nextMaterials: StudyMaterial[]) => void;
  getAllMaterials: () => StudyMaterial[];
  uid: (prefix?: string) => string;
  nowISO: () => string;
  onExecuteAction?: (action: Record<string, any>) => void;
  onNavigateToQuestions?: (subjectId: string, topicId: string) => void;
  onNavigateToHistory?: (subjectId: string, topicId: string) => void;
  onClose?: () => void;
}

export function mountTopicIntelligenceModal(opts: MountTopicIntelligenceModalOptions) {
  const { container, viewModel } = opts;

  function renderModal(open: boolean) {
    if (!open || !viewModel) {
      unmountPreact(container);
      return;
    }

    const { subjectId, topicId, examId } = viewModel.snapshot;
    const topicMaterials = opts.getMaterials(subjectId, topicId);

    const materialsSlot = (
      <TopicMaterialsSection
        materials={topicMaterials}
        onAddMaterial={(payload: {
          title: string;
          kind: StudyMaterialKind;
          url: string | null;
          isPrimary: boolean;
        }) => {
          const created = createStudyMaterial({
            id: opts.uid('mat'),
            examId,
            subjectId,
            topicId,
            title: payload.title,
            kind: payload.kind,
            url: payload.url,
            isPrimary: payload.isPrimary,
            nowISO: opts.nowISO(),
          });
          if (!created) return;
          opts.onUpdateMaterials([...opts.getAllMaterials(), created]);
          renderModal(true);
        }}
        onSetPrimary={(materialId: string) => {
          const updated = setPrimaryStudyMaterial(opts.getAllMaterials(), materialId, opts.nowISO());
          opts.onUpdateMaterials(updated);
          renderModal(true);
        }}
        onArchiveMaterial={(materialId: string) => {
          const updated = archiveStudyMaterial(opts.getAllMaterials(), materialId, opts.nowISO());
          opts.onUpdateMaterials(updated);
          renderModal(true);
        }}
      />
    );

    mountPreact(
      <TopicIntelligenceView
        open={true}
        viewModel={viewModel}
        onClose={() => {
          renderModal(false);
          opts.onClose?.();
        }}
        onExecuteAction={opts.onExecuteAction}
        onNavigateToQuestions={opts.onNavigateToQuestions}
        onNavigateToHistory={opts.onNavigateToHistory}
        materialsSlot={materialsSlot}
      />,
      container
    );
  }

  renderModal(Boolean(viewModel));

  return {
    close: () => renderModal(false),
  };
}
