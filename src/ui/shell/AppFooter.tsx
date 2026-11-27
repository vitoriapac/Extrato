import { Fragment } from 'preact';
import { Icon } from '../primitives/icon.js';

/**
 * Rodapé global do app em blocos (Produto, Seus dados, Ajuda), linha de atalhos e assinatura.
 *
 * Os botões preservam os IDs públicos (`enterDemoBtn`, `openSalesLandingBtn`, `openSaasPlansBtn`,
 * `openDataManagementBtn`) porque os controladores de demonstração, backup e primeiro acesso
 * ligam seus listeners por ID durante o bootstrap. O componente é estático: renderiza uma vez,
 * antes desses controladores, e não guarda estado.
 */
export interface AppFooterProps {
  onOpenSearch?: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

export const APP_FOOTER_SHORTCUTS = Object.freeze([
  { keys: ['Ctrl/⌘', 'K'], label: 'busca' },
  { keys: ['Ctrl/⌘', 'Shift', '1–7'], label: 'troca de área' },
  { keys: ['Esc'], label: 'fecha' },
]);

export function AppFooter({ onOpenLegal }: AppFooterProps) {
  const openLegal = (tab: 'terms' | 'privacy') => {
    if (onOpenLegal) {
      onOpenLegal(tab);
      return;
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(tab === 'privacy' ? 'open-legal-privacy' : 'open-legal-terms')
      );
    }
  };

  return (
    <div class="app-footer">
      <div class="app-footer__columns">
        <section class="app-footer__column" aria-labelledby="appFooterProductTitle">
          <h2 class="app-footer__title" id="appFooterProductTitle">
            Produto
          </h2>
          <ul class="app-footer__list">
            <li>
              <button
                type="button"
                class="app-footer__link"
                id="openSalesLandingBtn"
                aria-haspopup="dialog"
              >
                <Icon name="compass" size={14} class="icon-inline" />
                Apresentação
              </button>
            </li>
            <li>
              <button
                type="button"
                class="app-footer__link"
                id="openSaasPlansBtn"
                aria-haspopup="dialog"
              >
                <Icon name="shield-check" size={14} class="icon-inline" />
                Planos Free &amp; Pro
              </button>
            </li>
            <li class="app-footer__item--stacked">
              <button
                type="button"
                class="app-footer__link"
                id="enterDemoBtn"
                aria-describedby="enterDemoNote"
              >
                <Icon name="play" size={14} class="icon-inline" />
                Explorar demonstração
              </button>
              <small class="app-footer__note" id="enterDemoNote">
                Dados fictícios, separados dos seus.
              </small>
            </li>
          </ul>
        </section>

        <section class="app-footer__column" aria-labelledby="appFooterDataTitle">
          <h2 class="app-footer__title" id="appFooterDataTitle">
            Seus dados
          </h2>
          <ul class="app-footer__list">
            <li>
              <button
                type="button"
                class="app-footer__link"
                id="openDataManagementBtn"
                aria-haspopup="dialog"
                aria-expanded="false"
              >
                <Icon name="database" size={14} class="icon-inline" />
                Gerenciar dados e backups
              </button>
            </li>
            <li class="app-footer__text">
              <Icon name="shield-check" size={14} class="icon-inline" />
              Salvo automaticamente no seu navegador
            </li>
            <li class="app-footer__text">
              <Icon name="file-text" size={14} class="icon-inline" />
              Extrato gerado localmente
            </li>
          </ul>
        </section>

        <section class="app-footer__column" aria-labelledby="appFooterHelpTitle">
          <h2 class="app-footer__title" id="appFooterHelpTitle">
            Legal
          </h2>
          <ul class="app-footer__list">
            <li>
              <button
                type="button"
                class="app-footer__link"
                id="openLegalTermsBtn"
                aria-haspopup="dialog"
                onClick={() => openLegal('terms')}
              >
                <Icon name="scale" size={14} class="icon-inline" />
                Termos de uso
              </button>
            </li>
            <li>
              <button
                type="button"
                class="app-footer__link"
                id="openLegalPrivacyBtn"
                aria-haspopup="dialog"
                onClick={() => openLegal('privacy')}
              >
                <Icon name="lock" size={14} class="icon-inline" />
                Política de privacidade
              </button>
            </li>
          </ul>
        </section>
      </div>

      <p class="app-footer__shortcuts" aria-label="Atalhos de teclado">
        <Icon name="command" size={14} class="icon-inline" />
        <strong class="app-footer__shortcuts-label">Atalhos</strong>
        {APP_FOOTER_SHORTCUTS.map(shortcut => (
          <span class="app-footer__shortcut" key={shortcut.label}>
            {shortcut.keys.map((key, index) => (
              <Fragment key={key}>
                {index > 0 && <span aria-hidden="true">+</span>}
                <kbd>{key}</kbd>
              </Fragment>
            ))}
            <span class="app-footer__shortcut-label">{shortcut.label}</span>
          </span>
        ))}
      </p>

      <div class="app-footer__signature">
        <p class="app-footer__signature-brand">
          <strong>Extrato de Estudos</strong>
          <span aria-hidden="true">·</span>
          <span>Planejamento, revisão e diagnóstico para concursos</span>
        </p>
        <p class="app-footer__signature-origin">
          Feito com{' '}
          <Icon name="heart" size={14} class="icon-inline app-footer__heart" />
          <span class="sr-only">amor</span>{' '}
          para estudantes brasileiros
        </p>
      </div>
    </div>
  );
}
