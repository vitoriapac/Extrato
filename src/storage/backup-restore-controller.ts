import { createClock } from '../core/clock.js';
import { isPlainObject } from '../core/utils.js';
import {
  AUTOMATIC_BACKUP_SLOTS,
  BACKUP_INDEX_KEY,
  BACKUP_KEY,
} from '../state/schema.js';
import { validateBackupData as validateBackupDataInternal } from './backup-validator.js';

const defaultClock = createClock();
const defaultNowISO = () => defaultClock.nowISO();

export async function calculateSha256(
  value: string | Uint8Array,
  subtle?: { digest: (algorithm: string, data: any) => Promise<ArrayBuffer> } | null
): Promise<string | null> {
  const cryptoSubtle =
    subtle ||
    (typeof window !== 'undefined' && window.crypto?.subtle ? window.crypto.subtle : undefined);
  if (!cryptoSubtle) return null;
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await cryptoSubtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface RotateAutomaticBackupOptions {
  storage?: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<boolean>;
    setDurable?: (key: string, value: string) => Promise<boolean>;
  };
  backupKey?: string;
  indexKey?: string;
  slotCount?: number;
  nowISO?: () => string;
}

export async function rotateAutomaticBackup(
  previousRaw: string | null,
  options: RotateAutomaticBackupOptions = {},
  defaultStorage?: RotateAutomaticBackupOptions['storage']
): Promise<boolean> {
  if (!previousRaw) return true;
  const storage = options.storage || defaultStorage;
  if (!storage) return false;
  const backupKey = options.backupKey || BACKUP_KEY;
  const indexKey = options.indexKey || BACKUP_INDEX_KEY;
  const slotCount = Math.max(1, Number(options.slotCount) || AUTOMATIC_BACKUP_SLOTS);
  const nowISO = options.nowISO || defaultNowISO;

  let parsed: any;
  try {
    parsed = JSON.parse(previousRaw);
  } catch {
    return false;
  }
  if (!parsed || !Array.isArray(parsed.subjects)) return false;

  let index: {
    nextSlot: number;
    snapshots: any[];
    version?: number;
    updatedAt?: string;
  } = { nextSlot: 0, snapshots: [] };

  try {
    const rawIndex = await storage.get(indexKey);
    if (rawIndex) {
      const candidate = JSON.parse(rawIndex);
      if (isPlainObject(candidate) && Array.isArray(candidate.snapshots)) {
        index = candidate as typeof index;
      }
    }
  } catch (error) {
    console.warn('Índice de backups inválido; iniciando um novo.', error);
  }

  const slot = Math.max(0, Number(index.nextSlot) || 0) % slotCount;
  const slotKey = `${backupKey}-${slot}`;
  const checksum = await calculateSha256(previousRaw);

  const writeFn = storage.setDurable || storage.set;
  if (!(await writeFn.call(storage, slotKey, previousRaw))) return false;

  const verifyRaw = await storage.get(slotKey);
  if (verifyRaw !== previousRaw || (checksum && (await calculateSha256(verifyRaw)) !== checksum)) {
    return false;
  }

  const bytes =
    typeof Blob !== 'undefined'
      ? new Blob([previousRaw]).size
      : new TextEncoder().encode(previousRaw).length;

  const entry = {
    slot,
    key: slotKey,
    createdAt: nowISO(),
    stateUpdatedAt: parsed.updatedAt || null,
    checksum,
    bytes,
  };

  index.snapshots = index.snapshots
    .filter(item => item && item.slot !== slot)
    .concat(entry)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  index.nextSlot = (slot + 1) % slotCount;
  index.version = 1;
  index.updatedAt = nowISO();

  return Boolean(await storage.set(indexKey, JSON.stringify(index)));
}

export interface CreateBackupValidatorOptions {
  ensureDefaults: (candidate: any) => void;
  migrateState: (raw: any) => any;
  currentSchemaVersion: number;
}

export function createBackupValidator(options: CreateBackupValidatorOptions) {
  return function validateBackupData(raw: any) {
    return validateBackupDataInternal(raw, {
      ensureDefaults: options.ensureDefaults,
      migrateState: options.migrateState,
      currentSchemaVersion: options.currentSchemaVersion,
    });
  };
}

export interface BackupRestoreCoordinatorOptions {
  getState: () => any;
  setState: (next: any) => void;
  ensureStateDefaults: () => void;
  restoreTimerFromState: () => void;
  setPersistenceBlocked: (blocked: boolean) => void;
  isPersistenceBlocked: () => boolean;
  persistAndRender: () => void;
  render: () => void;
  showToast: (message: string) => void;
}

export function createBackupRestoreCoordinator(options: BackupRestoreCoordinatorOptions) {
  function applyImportedBackup(normalizedState: any): boolean {
    const previousState = options.getState();
    const previousBlocked = options.isPersistenceBlocked();
    try {
      options.setState(normalizedState);
      options.ensureStateDefaults();
      options.restoreTimerFromState();
      options.setPersistenceBlocked(false);
      options.persistAndRender();
      options.showToast('Backup importado com sucesso.');
      return true;
    } catch (error) {
      options.setState(previousState);
      options.setPersistenceBlocked(previousBlocked);
      options.restoreTimerFromState();
      options.render();
      console.error('Erro ao importar backup', error);
      options.showToast(
        'O backup passou pela validação inicial, mas não pôde ser convertido. Seus dados atuais foram preservados.'
      );
      return false;
    }
  }

  return {
    applyImportedBackup,
  };
}
