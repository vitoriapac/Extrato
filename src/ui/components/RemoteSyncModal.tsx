import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';

export type RemoteSyncField = 'serverUrl' | 'username' | 'password' | 'passphrase';

export interface RemoteSyncModalProps {
  open: boolean;
  serverUrl: string;
  username: string;
  password: string;
  passphrase: string;
  passphraseHint: string;
  statusText: string;
  statusError: boolean;
  statusVisible: boolean;
  onFieldChange: (field: RemoteSyncField, value: string) => void;
  onClose: () => void;
  onSaveConfig: () => void;
  onTestConnection: () => void;
  onReconcile: () => void;
  onPush: () => void;
  onPull: () => void;
}

export function RemoteSyncModal({
  open,
  serverUrl,
  username,
  password,
  passphrase,
  passphraseHint,
  statusText,
  statusError,
  statusVisible,
  onFieldChange,
  onClose,
  onSaveConfig,
  onTestConnection,
  onReconcile,
  onPush,
  onPull,
}: RemoteSyncModalProps): JSX.Element {
  const passphraseRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      passphraseRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  const inputClass =
    'w-full box-border px-3 py-2 text-sm font-body rounded border border-border-control bg-paper text-text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';
  const statusClass = statusError
    ? 'rounded border border-red border-l-3 bg-red-bg text-red px-3 py-2.5 text-sm leading-relaxed'
    : 'rounded border border-border-default border-l-3 border-l-accent bg-info-bg text-text-primary px-3 py-2.5 text-sm leading-relaxed';

  return (
    <Dialog
      id="remoteSyncOverlay"
      open={open}
      onClose={onClose}
      title="Sincronização em Nuvem (WebDAV + E2EE)"
      maxWidth="xl"
      className={open ? 'show' : ''}
      aria-describedby="remoteSyncDescription"
    >
      <div class="flex flex-col gap-4 text-text-primary">
        <p id="remoteSyncDescription" class="text-sm text-text-secondary leading-relaxed m-0">
          Conecte-se ao seu Nextcloud, ownCloud ou WebDAV pessoal. Os dados são{' '}
          <strong class="text-text-primary font-semibold">
            criptografados com AES-GCM 256 bits
          </strong>{' '}
          antes do envio. O servidor nunca tem acesso ao conteúdo dos seus estudos.
        </p>

        <div class="flex flex-col gap-1.5">
          <label htmlFor="remoteSyncUrl" class="text-xs font-semibold text-text-primary">
            URL da pasta WebDAV
          </label>
          <input
            type="url"
            id="remoteSyncUrl"
            value={serverUrl}
            onInput={event =>
              onFieldChange('serverUrl', (event.currentTarget as HTMLInputElement).value)
            }
            placeholder="https://meu-nextcloud.com/remote.php/dav/files/usuario/estudos/"
            class={inputClass}
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label htmlFor="remoteSyncUsername" class="text-xs font-semibold text-text-primary">
              Usuário WebDAV
            </label>
            <input
              type="text"
              id="remoteSyncUsername"
              value={username}
              onInput={event =>
                onFieldChange('username', (event.currentTarget as HTMLInputElement).value)
              }
              placeholder="usuario"
              class={inputClass}
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label htmlFor="remoteSyncPassword" class="text-xs font-semibold text-text-primary">
              Senha / App Password
            </label>
            <input
              type="password"
              id="remoteSyncPassword"
              value={password}
              onInput={event =>
                onFieldChange('password', (event.currentTarget as HTMLInputElement).value)
              }
              placeholder="••••••••"
              autocomplete="off"
              class={inputClass}
            />
          </div>
        </div>

        <p class="text-xs text-text-secondary leading-relaxed m-0">
          Somente a URL, o usuário e a data da última sincronização são salvos neste navegador. A
          senha e a chave precisam ser informadas a cada sessão. O servidor precisa usar https:// e
          permitir acesso (CORS) a partir deste endereço — no Nextcloud/ownCloud, isso costuma
          exigir um app ou ajuste de CORS no servidor.
        </p>

        <div class="flex flex-col gap-1.5">
          <label htmlFor="remoteSyncPassphrase" class="text-xs font-semibold text-text-primary">
            Chave de Criptografia Mestre (E2EE)
          </label>
          <input
            ref={passphraseRef}
            type="password"
            id="remoteSyncPassphrase"
            value={passphrase}
            onInput={event =>
              onFieldChange('passphrase', (event.currentTarget as HTMLInputElement).value)
            }
            placeholder="Frase secreta para cifrar/decifrar os dados"
            aria-describedby="remoteSyncPassphraseHelp remoteSyncPassphraseHint"
            class={inputClass}
          />
          <small id="remoteSyncPassphraseHelp" class="block text-xs text-text-secondary">
            Guarde esta chave. Sem ela, os dados na nuvem não poderão ser decifrados.
          </small>
          <small
            id="remoteSyncPassphraseHint"
            aria-live="polite"
            class="block text-xs text-text-secondary"
          >
            {passphraseHint}
          </small>
        </div>

        <div
          id="remoteSyncStatusBox"
          hidden={!statusVisible}
          role={statusError ? 'alert' : 'status'}
          class={statusClass}
        >
          <span id="remoteSyncStatusMsg">{statusText}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" size="small" id="testRemoteSyncBtn" onClick={onTestConnection}>
            Testar conexão
          </Button>
          <Button variant="ghost" size="small" id="reconcileRemoteSyncBtn" onClick={onReconcile}>
            Verificar status
          </Button>
          <Button
            variant="primary"
            size="small"
            id="pushRemoteSyncBtn"
            iconLeft="cloud-upload"
            onClick={onPush}
          >
            Enviar para nuvem
          </Button>
          <Button
            variant="primary"
            size="small"
            id="pullRemoteSyncBtn"
            iconLeft="cloud-download"
            onClick={() => onPull()}
          >
            Baixar da nuvem
          </Button>
        </div>

        <div class="flex flex-wrap justify-end gap-2.5 pt-2 border-t border-border-default">
          <Button variant="ghost" id="closeRemoteSyncBtn" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" id="saveRemoteSyncConfigBtn" onClick={onSaveConfig}>
            Salvar URL e usuário
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
