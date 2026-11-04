import { subjectColorOf } from '../subjects/subject-color.js';

export type PedagogicalQuadrant =
  | 'consolidated'
  | 'forgetting_risk'
  | 'building'
  | 'critical';

export interface PedagogicalMatrixItem {
  id: string;
  name: string;
  colorSlot: number;
  mastery: number; // 0..100
  retention: number; // 0..100
  studyMinutes: number;
  questionsResolved: number;
  quadrant: PedagogicalQuadrant;
  quadrantLabel: string;
}

export interface PedagogicalMatrixModel {
  items: PedagogicalMatrixItem[];
  thresholdMastery: number;
  thresholdRetention: number;
  quadrantCounts: Record<PedagogicalQuadrant, number>;
}

export interface BuildPedagogicalMatrixOptions {
  subjects: Array<{
    id: string;
    name: string;
    color?: unknown;
    mastery?: number | null;
    retention?: number | null;
    studyMinutes?: number | null;
    questionsResolved?: number | null;
  }>;
  thresholdMastery?: number; // padrão 70
  thresholdRetention?: number; // padrão 60
}

export function classifyPedagogicalQuadrant(
  mastery: number,
  retention: number,
  thresholdMastery = 70,
  thresholdRetention = 60
): { quadrant: PedagogicalQuadrant; quadrantLabel: string } {
  if (mastery >= thresholdMastery && retention >= thresholdRetention) {
    return { quadrant: 'consolidated', quadrantLabel: 'Consolidada' };
  }
  if (mastery >= thresholdMastery && retention < thresholdRetention) {
    return { quadrant: 'forgetting_risk', quadrantLabel: 'Risco de Esquecimento' };
  }
  if (mastery < thresholdMastery && retention >= thresholdRetention) {
    return { quadrant: 'building', quadrantLabel: 'Em Construção' };
  }
  return { quadrant: 'critical', quadrantLabel: 'Vulnerabilidade Crítica' };
}

/**
 * Constrói o modelo de dados para a Matriz de Dispersão Pedagógica (Domínio × Retenção).
 * Função pura e determinística.
 */
export function buildPedagogicalMatrixModel({
  subjects = [],
  thresholdMastery = 70,
  thresholdRetention = 60,
}: BuildPedagogicalMatrixOptions): PedagogicalMatrixModel {
  const quadrantCounts: Record<PedagogicalQuadrant, number> = {
    consolidated: 0,
    forgetting_risk: 0,
    building: 0,
    critical: 0,
  };

  const items: PedagogicalMatrixItem[] = [];

  for (const s of subjects) {
    const mastery = Math.max(0, Math.min(100, Number(s.mastery) || 0));
    const retention = Math.max(0, Math.min(100, Number(s.retention) || 0));
    const studyMinutes = Math.max(0, Number(s.studyMinutes) || 0);
    const questionsResolved = Math.max(0, Number(s.questionsResolved) || 0);

    const { quadrant, quadrantLabel } = classifyPedagogicalQuadrant(
      mastery,
      retention,
      thresholdMastery,
      thresholdRetention
    );

    quadrantCounts[quadrant]++;

    items.push({
      id: s.id,
      name: s.name,
      colorSlot: subjectColorOf(s, subjects),
      mastery,
      retention,
      studyMinutes,
      questionsResolved,
      quadrant,
      quadrantLabel,
    });
  }

  return {
    items,
    thresholdMastery,
    thresholdRetention,
    quadrantCounts,
  };
}
