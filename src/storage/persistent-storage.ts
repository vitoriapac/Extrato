export interface PersistentStorageResult {
  supported: boolean;
  persisted: boolean | null;
  requested: boolean;
}

export interface PersistentStorageStatus {
  supported: boolean;
  persisted: boolean | null;
  usageMb: number | null;
  quotaMb: number | null;
}

interface StorageManagerLike {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
  estimate?: () => Promise<{ usage?: number; quota?: number }>;
}

function resolveStorageManager(navigatorObj?: { storage?: StorageManagerLike } | null): StorageManagerLike | null {
  if (!navigatorObj?.storage) return null;
  return navigatorObj.storage;
}

/**
 * Solicita armazenamento persistente (navigator.storage.persist) para reduzir o risco de o navegador
 * limpar o IndexedDB em situações de pouco espaço ou inatividade (ex.: Safari/iOS).
 */
export async function ensurePersistentStorage(
  navigatorObj: { storage?: StorageManagerLike } | null | undefined = (globalThis as { navigator?: { storage?: StorageManagerLike } }).navigator
): Promise<PersistentStorageResult> {
  const storage = resolveStorageManager(navigatorObj);
  if (!storage || typeof storage.persist !== 'function') {
    return { supported: false, persisted: null, requested: false };
  }
  try {
    if (typeof storage.persisted === 'function') {
      const alreadyPersisted = await storage.persisted();
      if (alreadyPersisted) {
        return { supported: true, persisted: true, requested: false };
      }
    }
    const granted = await storage.persist();
    return { supported: true, persisted: Boolean(granted), requested: true };
  } catch {
    return { supported: true, persisted: false, requested: true };
  }
}

/**
 * Consulta o estado atual de persistência e uso estimado do armazenamento local.
 */
export async function getPersistentStorageStatus(
  navigatorObj: { storage?: StorageManagerLike } | null | undefined = (globalThis as { navigator?: { storage?: StorageManagerLike } }).navigator
): Promise<PersistentStorageStatus> {
  const storage = resolveStorageManager(navigatorObj);
  if (!storage || typeof storage.persisted !== 'function') {
    return { supported: false, persisted: null, usageMb: null, quotaMb: null };
  }
  try {
    const persisted = Boolean(await storage.persisted());
    let usageMb: number | null = null;
    let quotaMb: number | null = null;
    if (typeof storage.estimate === 'function') {
      const estimate = await storage.estimate();
      if (typeof estimate?.usage === 'number' && Number.isFinite(estimate.usage)) {
        usageMb = Number((estimate.usage / (1024 * 1024)).toFixed(2));
      }
      if (typeof estimate?.quota === 'number' && Number.isFinite(estimate.quota)) {
        quotaMb = Number((estimate.quota / (1024 * 1024)).toFixed(0));
      }
    }
    return { supported: true, persisted, usageMb, quotaMb };
  } catch {
    return { supported: true, persisted: null, usageMb: null, quotaMb: null };
  }
}

export function formatPersistentStorageSummary(status: PersistentStorageStatus): string {
  if (!status.supported) {
    return 'Armazenamento persistente indisponível neste navegador. Exporte backups regularmente.';
  }
  if (status.persisted === true) {
    const usageSuffix = status.usageMb != null ? ` (${status.usageMb} MB em uso)` : '';
    return `Armazenamento persistente ativo neste navegador${usageSuffix}.`;
  }
  if (status.persisted === false) {
    return 'Armazenamento temporário: o navegador pode apagar dados sem uso prolongado. Instale como aplicativo ou exporte backups.';
  }
  return 'Status de armazenamento persistente indisponível.';
}
