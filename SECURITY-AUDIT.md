# Auditoria de segurança — StudyTrack

## Estado atual

- A CSP é declarada por `meta`: `script-src 'self'`, `worker-src 'self'`, `object-src 'none'`, `base-uri 'self'` e `form-action 'self'`. Scripts inline não são permitidos.
- `connect-src` permite `'self'`, qualquer origem `https:` e `http://localhost:*`/`http://127.0.0.1:*`. A sincronização WebDAV conecta a um servidor escolhido pela própria pessoa, que uma CSP declarada em `meta` não consegue listar de antemão. `http:` remoto continua bloqueado, o que reforça a recusa de credenciais fora de `https://` no provider. Um teste unitário (`remote-sync-provider.test.js`) falha se a diretiva for ampliada ou restringida.
- `style-src-attr 'unsafe-inline'` continua habilitado para atributos `style` usados por gráficos e indicadores com valores dinâmicos, como larguras de barras e progresso. A política de estilos inline ainda não foi reduzida.
- Eventos declarativos são despachados por uma whitelist de handlers; handlers desconhecidos e payloads malformados são rejeitados.
- Conteúdo textual vindo do estado passa por `escapeHtml`/`escapeAttr` antes de ser inserido em HTML. Nos componentes declarativos em Preact (`src/ui/primitives/` e telas `.tsx`), o próprio JSX realiza o escape estrutural automático de nós de texto, mitigando riscos de XSS na fonte.
- O Service Worker usa stale-while-revalidate para assets estáticos e prioriza a rede em navegações, com fallback offline.

## Cabeçalhos HTTP

Produção é servida pelo Cloudflare (`wrangler.jsonc`, assets de `dist/`). O build (`scripts/build-prod.mjs`) gera `dist/_headers` com a CSP lida do `index.html` mais `frame-ancestors 'none'` (a meta não suporta essa diretiva), `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` e `Cache-Control: no-cache` para `/service-worker.js`. O `vercel.json` espelha CSP e HSTS para o outro host. O teste `tests/unit/csp-headers.test.js` falha se a CSP do cabeçalho divergir da meta (ignorando `frame-ancestors`). A landing herda a CSP pelo cabeçalho (não tem meta própria; não usa scripts nem estilos inline).

## Risco residual aceito: `connect-src https:`

A CSP permite conexão a qualquer origem `https:` por causa do WebDAV em servidor escolhido pela pessoa. Em caso de XSS, isso permitiria exfiltrar dados para qualquer host https. É uma decisão consciente; `http:` remoto segue bloqueado. Quando o SaaS entrar, avaliar WebDAV apenas via domínios cadastrados e restringir `connect-src`.

## Sincronização WebDAV (E2EE)

- Envelopes novos usam `version: 2`: o `createdAt` também vai dentro do texto cifrado e precisa coincidir com o externo, senão o envelope é tratado como adulterado. Envelopes v1 continuam aceitos.
- Se a versão remota for mais antiga que a última sincronizada (`lastSync.envelopeAt`), o download é recusado até haver confirmação explícita (proteção contra rollback por servidor malicioso).
- A frase de criptografia exige no mínimo 12 caracteres para enviar (o download não é bloqueado, para permitir recuperar backups antigos). A UI mostra a força e avisa que perder a frase perde o backup remoto.

## Backend SaaS (`supabase/`, ainda não lançado)

- **Webhook** `abacatepay-webhook`: segredo só no header `x-webhook-secret`, comparação em tempo constante, corpo limitado a 64 KB. Plano e valor vêm do pedido em `billing_orders` (nunca do payload); liquidação atômica e idempotente pela função SQL `settle_billing_order`. Pendente: confirmar com a AbacatePay se existe assinatura HMAC do corpo e o formato real do payload, em staging.
- **RLS**: `has_active_pro()` é exigida nas policies de INSERT/UPDATE de `user_study_states`; há limite de 5 MB e faixa de `schema_version` (constraints `NOT VALID`); escrita em `profiles`, `billing_orders` e `user_state_snapshots` revogada para `anon` e `authenticated`. Teste manual em `supabase/tests/paywall_rls.sql`. Observação: `has_active_pro(uid)` aceita qualquer uid, o que permite a um usuário autenticado descobrir se outro é Pro (impacto baixo).
- **`state-sync` e checkout**: limites de corpo, validação de forma, erros genéricos, rate limit de 60 s por pedido pendente, CORS por lista `ALLOWED_ORIGINS` e `supabase-js` com versão exata em `_shared/supabase.ts`.
- Antes do lançamento: configurar `ALLOWED_ORIGINS` e `APP_BASE_URL`, rodar migration e teste SQL em staging, rotacionar `ABACATEPAY_WEBHOOK_SECRET` e `ABACATEPAY_API_KEY` se já usados.

## Escape de HTML

Uma regra ESLint (`no-restricted-syntax`, como aviso) sinaliza atribuição de template literal com interpolação a `innerHTML`; os usos existentes foram revisados por amostragem. Ids de backup passam por `isSafeId`, que rejeita aspas e vírgulas e impede injeção de argumentos nas ações delegadas (regressão em `tests/unit/id-injection.test.js`). Trusted Types não foi adotado.

## Pendência de CSP

Mapear os atributos `style` restantes, substituir os valores que possam usar classes ou regras de CSS e avaliar separadamente os valores dinâmicos de gráficos. Após essa migração, remover `style-src-attr 'unsafe-inline'` e validar cronômetro, gráficos, temas, modais e responsividade sob a política restrita. Até lá, a permissão permanece explicitamente necessária para os estilos inline existentes.

## Cache PWA

O build calcula um fingerprint determinístico dos fontes e assets e o aplica ao nome do cache, às URLs versionadas do CSS e dos bundles, inclusive ao catálogo carregado sob demanda. O `service-worker.js` é gerado a partir de `service-worker.template.js`, e o deploy do Pages executa o build antes de publicar. Caches com versões anteriores são removidos durante a ativação do Service Worker.
