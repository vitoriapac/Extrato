/**
 * Siglas que não se repetem. Três letras; quando duas disciplinas colidem, a de nome mais curto fica com as três
 * letras e as outras ganham a inicial da última palavra (MAT, MAT·F; PRO, PRO·E).
 */
export function matrixAbbreviations(names: string[]): Map<string, string> {
  const letters = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase();
  const groups = new Map<string, string[]>();
  for (const name of names) {
    const key = letters(name).slice(0, 3);
    groups.set(key, [...(groups.get(key) || []), name]);
  }
  const result = new Map<string, string>();
  const taken = new Set<string>();
  for (const [key, members] of groups) {
    [...members]
      .sort((a, b) => letters(a).length - letters(b).length)
      .forEach((name, index) => {
        let sigla = key;
        if (index > 0) {
          const last = name.trim().split(/\s+/).pop() || '';
          sigla = `${key}·${letters(last).charAt(0)}`;
        }
        // Último recurso: o prefixo vai crescendo até a sigla ser única.
        for (let size = 4; taken.has(sigla) && size <= 24; size++) sigla = letters(name).slice(0, size);
        taken.add(sigla);
        result.set(name, sigla);
      });
  }
  return result;
}
