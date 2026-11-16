import { h } from 'preact';
import { mountPreact } from '../preact-mount.js';
import { AppFooter } from './AppFooter.js';

/**
 * Renderiza o rodapé global dentro de `#appFooter` (o `<footer>` estático ao fim da página).
 *
 * Deve rodar antes dos controladores que ligam listeners por ID nos botões do rodapé
 * (demonstração, backup e primeiro acesso). Retorna `false` quando não há ponto de montagem.
 */
export function mountAppFooter(doc: Document): boolean {
  const mount = doc.getElementById('appFooter');
  if (!mount) return false;
  mountPreact(
    h(AppFooter, {
      onOpenSearch: () => doc.getElementById('globalSearchOpenBtn')?.click(),
      onOpenLegal: tab =>
        doc.defaultView?.dispatchEvent(
          new CustomEvent(tab === 'privacy' ? 'open-legal-privacy' : 'open-legal-terms')
        ),
    }),
    mount
  );
  return true;
}
