/**
 * Estratégia e Resolução de Fusão de Contas no Login (src/domain/auth/account-merge.ts)
 *
 * Módulo puro e determinístico de domínio para decidir a ação de sincronização
 * quando um estudante em modo anônimo entra com sua conta (Clerk) na nuvem.
 */

export type MergeResolutionChoice = 'use_remote' | 'use_local' | 'backup_first';

export type MergeDecision =
  | { type: 'noop'; reason: 'empty_both' | 'identical_checksum' }
  | { type: 'initial_push'; reason: 'local_only' }
  | { type: 'initial_pull'; reason: 'remote_only' }
  | {
      type: 'conflict';
      reason: 'divergent_states';
      localSummary: {
        updatedAt: string | null;
        checksum: string | null;
        itemCount?: number;
      };
      remoteSummary: {
        updatedAt: string | null;
        checksum: string | null;
      };
    };

export interface DetermineMergeParams {
  hasLocalData: boolean;
  localUpdatedAt?: string | null;
  localChecksum?: string | null;
  localItemCount?: number;
  hasRemoteData: boolean;
  remoteUpdatedAt?: string | null;
  remoteChecksum?: string | null;
}

/**
 * Avalia se há necessidade de upload inicial, download ou resolução de conflito manual.
 */
export function determineMergeDecision(params: DetermineMergeParams): MergeDecision {
  const {
    hasLocalData,
    localUpdatedAt = null,
    localChecksum = null,
    localItemCount = 0,
    hasRemoteData,
    remoteUpdatedAt = null,
    remoteChecksum = null,
  } = params;

  if (!hasLocalData && !hasRemoteData) {
    return { type: 'noop', reason: 'empty_both' };
  }

  if (hasLocalData && !hasRemoteData) {
    return { type: 'initial_push', reason: 'local_only' };
  }

  if (!hasLocalData && hasRemoteData) {
    return { type: 'initial_pull', reason: 'remote_only' };
  }

  // Ambos possuem dados
  if (localChecksum && remoteChecksum && localChecksum === remoteChecksum) {
    return { type: 'noop', reason: 'identical_checksum' };
  }

  return {
    type: 'conflict',
    reason: 'divergent_states',
    localSummary: {
      updatedAt: localUpdatedAt,
      checksum: localChecksum,
      itemCount: localItemCount,
    },
    remoteSummary: {
      updatedAt: remoteUpdatedAt,
      checksum: remoteChecksum,
    },
  };
}
