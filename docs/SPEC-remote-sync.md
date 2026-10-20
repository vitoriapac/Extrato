# Spec: remote-sync

Módulo do [mapa de correções](CAPABILITY-MAP-review-remediation.md). Corrige a sincronização WebDAV com E2EE (achados #3, #4, #10, #11, #13).

## Objetivo

Quem estuda em mais de um aparelho envia e baixa um backup criptografado da própria pasta WebDAV sem perder trabalho de outro aparelho e sem expor credenciais. Hoje "Enviar para nuvem" sobrescreve a nuvem sem checar nada, o envio inclui estado de memória que não deveria ser salvo, a derivação de chave está abaixo da recomendação atual, a senha do WebDAV pode trafegar em HTTP aberto, e falhas de CORS aparecem como erro genérico.

## Requisitos

### R1 — Confirmação antes de sobrescrever a nuvem (#3)
Antes de qualquer upload, o app consulta o arquivo remoto e pede confirmação (`showConfirm`) quando **a nuvem mudou desde a última sincronização deste navegador**.

- **Marcador de versão:** o `createdAt` do envelope remoto. Ele fica no JSON do envelope, sem criptografia, então a checagem não exige a chave nem decriptografa nada.
- **Base local:** após cada push ou pull bem-sucedido, o app grava `lastSyncedEnvelopeAt` junto às preferências (`studytrack_remote_sync_config`), associado à `serverUrl`. É um dado não secreto.
- **Regras:**

| Situação remota | Ação |
|---|---|
| Arquivo não existe (404) | Envia direto. |
| `createdAt` remoto igual a `lastSyncedEnvelopeAt` | Envia direto (só este navegador escreveu desde então). |
| `createdAt` diferente, ou sem `lastSyncedEnvelopeAt` local | Confirmação: "A nuvem tem um backup de {data/hora} que este navegador ainda não baixou. Enviar vai substituí-lo. Continuar?" |
| Arquivo existe mas não é um envelope válido | Confirmação com o texto "O arquivo remoto não é um backup reconhecido…" |
| Erro de rede/HTTP na consulta | Não envia; mostra o erro. |

- Comparar `updatedAt` local × remoto (o que `reconcile` faz hoje) **não** detecta esse conflito: o `updatedAt` local muda a cada salvamento, inclusive ao abrir o app. Por isso o marcador é a versão do envelope, e não o relógio do estado.
- "Verificar status" passa a usar a mesma regra para dizer se a nuvem mudou desde a última sincronização.

### R2 — Enviar só o estado persistente (#4)
Upload e verificação usam `pickPersistentState(state)`, a mesma forma do snapshot e do backup local. Um ciclo push → pull passa pela validação de backup sem campos de memória.

### R3 — PBKDF2 com 600 mil iterações e teto na leitura (#10)
- Novos envelopes usam 600 000 iterações (recomendação OWASP para PBKDF2-SHA256). O valor fica em uma constante única, em vez de `100000` repetido três vezes.
- Na decriptação, `iterations` vem do envelope e é aceito só entre 100 000 e 2 000 000. Fora disso, o erro é "Envelope com parâmetros de criptografia fora do permitido." e nenhuma derivação roda. Isso evita que um arquivo adulterado trave a aba.
- Envelopes existentes (100 000) continuam decriptografando.

### R4 — Basic auth só em HTTPS (#11)
Com usuário ou senha preenchidos, URLs `http://` são recusadas com "Use uma URL https:// — a senha do WebDAV seria enviada sem proteção." A exceção é `http://localhost` e `http://127.0.0.1`, usados para servidores locais de desenvolvimento.

### R5 — Senhas com qualquer caractere (#11)
O cabeçalho Basic é montado a partir dos bytes UTF-8 de `usuario:senha`, reaproveitando o conversor base64 de `crypto-utils.js` (que passa a ser exportado). Hoje `btoa` lança erro com caracteres fora do Latin-1.

### R6 — Mensagem clara para CORS/rede (#13)
Quando o `fetch` falha sem resposta (o `TypeError` do navegador, típico de CORS ou CSP bloqueando, DNS ou servidor fora do ar), a mensagem passa a ser: "Não foi possível falar com o servidor. Verifique a URL, se ele permite acesso (CORS) a partir de {origem} e se o navegador não bloqueou a conexão." Vale para testar, verificar, enviar e baixar. O texto de ajuda do modal ganha uma linha sobre CORS.

### R7 — CSP permite conectar ao servidor WebDAV (achado na verificação, aprovado em 2026-10-20)
`connect-src 'self'` bloqueava toda requisição WebDAV. A diretiva passa a ser `connect-src 'self' https: http://localhost:* http://127.0.0.1:*`: qualquer servidor `https` escolhido pela pessoa e servidores locais de desenvolvimento, mantendo `http:` remoto bloqueado. Um teste unitário fixa exatamente esse conjunto e o motivo fica registrado em `SECURITY-AUDIT.md`.

## Fora de escopo
Merge automático de dados entre aparelhos, histórico ou versões na nuvem, outros provedores além de WebDAV, troca da chave mestra, sincronização automática em segundo plano. O teste quebrado `preferências: salva apenas URL e usuário…` pertence ao módulo `build-hygiene`.

## Comandos
```
npm test                 # node --test tests/unit/*.test.js
npm run check:types      # tsc -p jsconfig.json --noEmit
npm run build            # regenera src/app.bundle.js, index.html, service-worker.js
npm run check:bundle
```

## Estrutura
```
src/core/crypto-utils.js                       → PBKDF2/AES-GCM, constante de iterações, teto, base64 exportado
src/storage/remote-sync-provider.js            → WebDAV: leitura do envelope, regra de https, Basic UTF-8, erros de rede
src/ui/controllers/remote-sync-controller.js   → fluxo push com confirmação, lastSyncedEnvelopeAt nas preferências
src/app.js                                     → getState com pickPersistentState
index.html                                     → linha de ajuda sobre CORS
tests/unit/crypto-utils.test.js
tests/unit/remote-sync-provider.test.js
tests/unit/remote-sync-controller.test.js
```

## Estilo
Seguir o dos arquivos atuais: fábricas `createX({deps})` com dependências injetadas (`fetch`, `confirm`, `notify`), `Object.freeze` na API, erros com mensagem em pt-BR e nenhum segredo persistido.

```js
if (!passphrase) throw new TypeError('Chave de criptografia mestre obrigatória.');
```

## Testes
`node:test` em `tests/unit/`, com `fetch` falso. No mínimo:
- R1: 404 envia sem confirmação; `createdAt` igual envia; diferente pede confirmação e só envia após o `onConfirm`; sem marcador local pede confirmação; erro de rede não envia; push e pull bem-sucedidos gravam `lastSyncedEnvelopeAt`; a checagem não chama `decryptPayload`.
- R2: o corpo enviado não contém um campo de memória presente no `state`.
- R3: envelope novo tem `iterations: 600000`; envelope de 100 000 decriptografa; 10 e 10 000 000 são rejeitados sem derivar.
- R4: `http://` com credenciais é recusado; `http://localhost` é aceito; `http://` sem credenciais é aceito.
- R5: senha `ção€` gera o cabeçalho base64 dos bytes UTF-8.
- R6: `fetch` que lança `TypeError` produz a mensagem de CORS com a origem.

## Limites
- Sempre: manter senha e chave só na memória do formulário; validar e criar o snapshot antes de qualquer pull; textos em pt-BR.
- Perguntar antes: mudar o formato do envelope (campos ou `version`), adicionar dependência, persistir qualquer dado novo além de `lastSyncedEnvelopeAt`.
- Nunca: enviar sem confirmação quando a nuvem mudou; logar senha, chave ou estado decriptografado; enfraquecer testes existentes.

## Critérios de sucesso
1. Aparelho A sincroniza; aparelho B envia depois; A edita e clica "Enviar" → aparece a confirmação, e cancelar mantém o arquivo de B intacto.
2. O corpo enviado é igual a `pickPersistentState(state)` criptografado.
3. Um envelope novo traz `iterations: 600000`; um envelope antigo (100 000) ainda é baixado; `iterations: 1e10` é recusado na hora.
4. `http://servidor` com senha é recusado antes de qualquer `fetch`.
5. `npm test` (incluindo a correção do teste de preferências feita em `build-hygiene`), `npm run check:types` e `npm run check:bundle` passam.

## Decisões (aprovadas em 2026-10-20)
1. R1: conflito detectado pelo `createdAt` do envelope comparado com `lastSyncedEnvelopeAt`, não pelo `updatedAt` do estado.
2. R4: URL `http://` com credenciais é recusada (exceto localhost/127.0.0.1).
3. R1: arquivo remoto que não é envelope válido pede confirmação antes de ser sobrescrito.
