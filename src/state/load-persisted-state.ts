export interface LoadPersistedStateOptions {
  storage: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<boolean>;
    setDurable?: (key: string, value: string) => Promise<boolean>;
  };
  storageKey: string;
  backupIndexKey: string;
  currentSchemaVersion: number;
  /** Lança erro quando o texto não é um estado válido. */
  normalize: (raw: string) => any;
  serialize: (state: any) => string;
  sha256: (text: string) => Promise<string | null>;
}

export interface LoadPersistedStateResult {
  /** null: usar o estado padrão. */
  state: any;
  /** Texto que está gravado agora na chave principal. */
  persisted: string | null;
  warning: string;
  /** true: nada pode ser gravado até importar um backup, para não apagar os dados ilegíveis. */
  blocked: boolean;
}

export const unreadableStateKey = (storageKey: string) => `${storageKey}-unreadable`;

function schemaVersionOf(raw: string): number {
  try {
    return Number(JSON.parse(raw)?.schemaVersion) || 0;
  } catch {
    return 0;
  }
}

export async function readLatestValidSnapshot({
  storage,
  backupIndexKey,
  normalize,
  sha256,
}: Pick<LoadPersistedStateOptions, 'storage' | 'backupIndexKey' | 'normalize' | 'sha256'>) {
  const rawIndex = await storage.get(backupIndexKey);
  if (!rawIndex) return null;
  const index = JSON.parse(rawIndex);
  const snapshots = Array.isArray(index.snapshots)
    ? index.snapshots
        .slice()
        .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)))
    : [];
  for (const snapshot of snapshots) {
    try {
      const raw = await storage.get(snapshot.key);
      if (!raw) continue;
      if (snapshot.checksum && (await sha256(raw)) !== snapshot.checksum) continue;
      return { raw, state: normalize(raw) };
    } catch (error) {
      console.warn('Snapshot de recuperacao ignorado', error);
    }
  }
  return null;
}

export async function loadPersistedState(
  options: LoadPersistedStateOptions
): Promise<LoadPersistedStateResult> {
  const { storage, storageKey, currentSchemaVersion, normalize, serialize } = options;
  const raw = await storage.get(storageKey);
  if (!raw) return { state: null, persisted: raw, warning: '', blocked: false };
  try {
    return { state: normalize(raw), persisted: raw, warning: '', blocked: false };
  } catch (error) {
    console.warn('Estado principal inválido', error);
  }
  // Guarda a cópia ilegível antes de qualquer gravação poder substituí-la.
  try {
    await (storage.setDurable || storage.set)(unreadableStateKey(storageKey), raw);
  } catch (error) {
    console.warn('Não foi possível preservar a cópia ilegível', error);
  }
  // Dados de uma versão mais nova não podem ser trocados por um snapshot mais antigo.
  if (schemaVersionOf(raw) > currentSchemaVersion)
    return {
      state: null,
      persisted: raw,
      blocked: true,
      warning:
        'Seus dados foram salvos por uma versão mais nova do StudyTrack. Recarregue a página para atualizar; nada será gravado até lá.',
    };
  const recovered = await readLatestValidSnapshot(options);
  if (recovered) {
    const serialized = serialize(recovered.state);
    await storage.set(storageKey, serialized);
    return {
      state: recovered.state,
      persisted: serialized,
      blocked: false,
      warning:
        'Os dados principais estavam inválidos e foram recuperados do backup automático mais recente.',
    };
  }
  return {
    state: null,
    persisted: raw,
    blocked: true,
    warning:
      'Não foi possível ler os dados salvos. Uma cópia foi preservada e nada será gravado até você importar um backup.',
  };
}
