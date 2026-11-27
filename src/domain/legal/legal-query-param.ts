/**
 * Extrai parâmetros de consulta jurídica da URL (?legal=terms | ?legal=privacy | ?legal=rights).
 * Arquivo próprio para a abertura do app não carregar o texto dos documentos legais.
 */
export function parseLegalQueryParam(urlOrSearch: string): 'terms' | 'privacy' | 'rights' | null {
  try {
    const search = urlOrSearch.includes('?') ? urlOrSearch.split('?')[1] : urlOrSearch;
    const params = new URLSearchParams(search);
    const legalParam = params.get('legal')?.toLowerCase();
    if (legalParam === 'terms' || legalParam === 'privacy' || legalParam === 'rights') {
      return legalParam;
    }
  } catch {
    // Falha silenciosa
  }
  return null;
}
