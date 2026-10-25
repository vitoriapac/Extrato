/**
 * Controller de Interação do Usuário com Backup, Recuperação e Zona de Perigo.
 */

export interface BackupModalControllerContext {
  document: any;
  window: any;
  storage: {
    get: (key: string) => Promise<string | null>;
    remove: (key: string) => Promise<void>;
  };
  storageKeys: {
    storageKey: string;
    backupKey: string;
    backupIndexKey: string;
    automaticSlots: number;
  };
  sha256: (text: string) => Promise<string>;
  validate: (data: any) => { valid: boolean; message?: string; normalized?: any; version?: number };
  serialize: (state: any) => string;
  fileName: (date: string, options?: { recovery?: boolean }) => string;
  summary: (data: any, version: number) => string;
  getState: () => any;
  getDate: () => string;
  notify: (message: string) => void;
  showConfirm: (message: string, onOk: () => void) => void;
  showPrompt: (
    message: string,
    config: {
      label: string;
      placeholder: string;
      confirmLabel: string;
      validate: (v: string) => string;
    },
    onOk: () => void | Promise<void>
  ) => void;
  isDemoMode: () => boolean;
  onApplyBackup: (normalizedState: any) => boolean | Promise<boolean>;
  onResetComplete: () => void;
  maxBytes?: number;
}

export function confirmDestructiveReset(
  showConfirm: (message: string, onOk: () => void) => void,
  showPrompt: (
    message: string,
    config: {
      label: string;
      placeholder: string;
      confirmLabel: string;
      validate: (v: string) => string;
    },
    onOk: () => void | Promise<void>
  ) => void,
  onExecute: () => Promise<void>
): void {
  showConfirm(
    'Esta ação excluirá disciplinas, sessões, revisões, questões, simulados, metas, histórico e configurações. Exporte um backup antes de continuar.',
    () =>
      showPrompt(
        'Digite LIMPAR para confirmar a exclusão definitiva.',
        {
          label: 'Confirmação',
          placeholder: 'LIMPAR',
          confirmLabel: 'Limpar dados',
          validate: value => (value === 'LIMPAR' ? '' : 'Digite LIMPAR exatamente como exibido.'),
        },
        onExecute
      )
  );
}

export async function exportAutomaticBackupHelper({
  storage,
  backupIndexKey,
  sha256,
  validate,
  download,
  notify,
  isDemoMode,
  todayISO,
}: {
  storage: { get: (key: string) => Promise<string | null> };
  backupIndexKey: string;
  sha256: (text: string) => Promise<string>;
  validate: (data: any) => { valid: boolean };
  download: (raw: string, name: string) => void;
  notify: (msg: string) => void;
  isDemoMode: () => boolean;
  todayISO: () => string;
}): Promise<boolean> {
  if (isDemoMode()) {
    notify('A recuperação real fica indisponível durante a demonstração.');
    return false;
  }
  try {
    const rawIndex = await storage.get(backupIndexKey);
    if (!rawIndex) {
      notify('Ainda não existe um snapshot automático de recuperação.');
      return false;
    }
    const index = JSON.parse(rawIndex);
    const snapshot = Array.isArray(index.snapshots)
      ? index.snapshots
          .slice()
          .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
      : null;
    if (!snapshot?.key) {
      notify('O índice de recuperação está vazio.');
      return false;
    }
    const raw = await storage.get(snapshot.key);
    const checksum = raw ? await sha256(raw) : null;
    if (!raw || (snapshot.checksum && checksum !== snapshot.checksum)) {
      notify('O snapshot automático falhou na verificação de integridade.');
      return false;
    }
    const validation = validate(JSON.parse(raw));
    if (!validation.valid) {
      notify('O snapshot automático não contém um estado restaurável.');
      return false;
    }
    const fileName = `recuperacao-extrato-estudos-${String(snapshot.createdAt || todayISO()).slice(
      0,
      10
    )}.json`;
    download(raw, fileName);
    notify('Snapshot verificado e exportado. Use “Importar backup” para restaurá-lo.');
    return true;
  } catch (error) {
    console.error('Falha ao exportar snapshot automático', error);
    notify('Não foi possível exportar o snapshot automático.');
    return false;
  }
}

export function createBackupModalController(ctx: BackupModalControllerContext) {
  const download = (raw: string, name: string) => {
    const blob = new ctx.window.Blob([raw], { type: 'application/json' });
    const url = ctx.window.URL.createObjectURL(blob);
    const anchor = ctx.document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    ctx.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    ctx.window.URL.revokeObjectURL(url);
  };

  const exportState = (state: any, date: string): boolean => {
    if (ctx.isDemoMode()) {
      ctx.notify('Backups ficam indisponíveis durante a demonstração.');
      return false;
    }
    download(ctx.serialize(state), ctx.fileName(date));
    ctx.notify('Backup exportado.');
    return true;
  };

  const exportAutomatic = async (): Promise<boolean> => {
    return exportAutomaticBackupHelper({
      storage: ctx.storage,
      backupIndexKey: ctx.storageKeys.backupIndexKey,
      sha256: ctx.sha256,
      validate: ctx.validate,
      download,
      notify: ctx.notify,
      isDemoMode: ctx.isDemoMode,
      todayISO: ctx.getDate,
    });
  };

  const importFile = (file: any): void => {
    if (ctx.isDemoMode()) {
      ctx.notify('A importação fica indisponível durante a demonstração.');
      return;
    }
    if (!file) return;
    const maxBytes = ctx.maxBytes ?? 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      ctx.notify('O arquivo excede o limite de 10 MB para importação.');
      return;
    }
    const reader = new ctx.window.FileReader();
    reader.onload = () => {
      let parsed: any;
      try {
        parsed = JSON.parse(reader.result);
      } catch {
        ctx.notify('Arquivo inválido — não parece um backup deste extrato.');
        return;
      }
      const result = ctx.validate(parsed);
      if (!result.valid) {
        ctx.notify(result.message || 'Arquivo de backup inválido.');
        return;
      }
      const summaryText = ctx.summary(result.normalized, result.version || 1);
      ctx.showConfirm(
        `${summaryText} Importar vai substituir todos os dados atuais. Continuar?`,
        () => {
          ctx.onApplyBackup(result.normalized);
        }
      );
    };
    reader.onerror = () => ctx.notify('Não foi possível ler o arquivo selecionado.');
    reader.readAsText(file);
  };

  const clearAllData = async (): Promise<void> => {
    const { storageKey, backupKey, backupIndexKey, automaticSlots } = ctx.storageKeys;
    const keys = [
      storageKey,
      backupKey,
      backupIndexKey,
      ...Array.from({ length: automaticSlots }, (_, index) => `${backupKey}-${index}`),
    ];
    await Promise.all(keys.map(k => ctx.storage.remove(k)));
    ctx.onResetComplete();
  };

  const handleClearAllDataClick = (): void => {
    confirmDestructiveReset(ctx.showConfirm, ctx.showPrompt, clearAllData);
  };

  const listeners: Array<() => void> = [];
  const listen = (target: any, event: string, handler: (e: any) => void) => {
    if (!target) return;
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener?.(event, handler));
  };

  const mount = () => {
    const fileInput = ctx.document.getElementById('importBackupFile');
    listen(ctx.document.getElementById('exportBackupBtn'), 'click', () =>
      exportState(ctx.getState(), ctx.getDate())
    );
    listen(ctx.document.getElementById('exportAutomaticBackupBtn'), 'click', () => {
      exportAutomatic();
    });
    listen(ctx.document.getElementById('importBackupBtn'), 'click', () => fileInput?.click());
    listen(fileInput, 'change', () => {
      if (fileInput.files?.[0]) importFile(fileInput.files[0]);
      fileInput.value = '';
    });
    listen(ctx.document.getElementById('clearAllDataBtn'), 'click', handleClearAllDataClick);
  };

  const unmount = () => {
    listeners.splice(0).forEach(remove => remove());
  };

  return {
    download,
    exportState,
    exportAutomatic,
    importFile,
    clearAllData,
    confirmDestructiveReset: handleClearAllDataClick,
    mount,
    unmount,
  };
}
