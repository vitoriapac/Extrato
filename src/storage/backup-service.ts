export function serializeBackup(state: unknown, { space = 2 }: { space?: number } = {}): string {
  if (!state || typeof state !== 'object') throw new TypeError('Estado inválido para backup.');
  return JSON.stringify(state, null, space);
}

export type ParseBackupResult = { valid: true; data: any } | { valid: false; message: string };

export function parseBackupText(
  raw: unknown,
  { maxBytes = 10 * 1024 * 1024 }: { maxBytes?: number } = {}
): ParseBackupResult {
  if (typeof raw !== 'string')
    return { valid: false, message: 'O backup precisa ser um arquivo de texto.' };
  if (new TextEncoder().encode(raw).length > maxBytes)
    return { valid: false, message: 'O arquivo excede o limite permitido para importação.' };
  try {
    return { valid: true, data: JSON.parse(raw) };
  } catch {
    return { valid: false, message: 'Arquivo inválido — não parece um backup deste extrato.' };
  }
}

export function backupFileName(
  date: string,
  { recovery = false }: { recovery?: boolean } = {}
): string {
  return `${recovery ? 'recuperacao' : 'backup'}-extrato-estudos-${date}.json`;
}
