# Plano de implementação: correções da auditoria de segurança

Data: 2026-11-07. Origem: auditoria de segurança completa (13 achados).
Regra do projeto: `cloud-saas-provider.ts` e `entitlements.ts` são stubs reservados; não remover nem sinalizar.

## Ordem e dependências

| Fase | Achados | Bloqueia lançamento do SaaS? | Dependência |
|---|---|---|---|
| 1. Backend de pagamento e paywall | 1, 2 | Sim | nenhuma |
| 2. Endurecer Edge Functions | 3, 4, 5, 6 | Sim | Fase 1 (mesmos arquivos) |
| 3. Cabeçalhos HTTP e CSP | 7, 8, 9 | Não, mas antes de divulgar | independente |
| 4. Front-end defensivo | 10, 11, 12, 13 | Não | independente |

Fases 3 e 4 podem rodar em paralelo com 1 e 2 (arquivos diferentes). Dentro de 1 e 2, tudo na mesma pasta `supabase/`; fazer em sequência.

---

## Fase 1: pagamento e paywall (Alta)

### 1.1 Webhook `abacatepay-webhook` (achado 1)
Arquivo: `supabase/functions/abacatepay-webhook/index.ts`

- [ ] Ler o segredo apenas do header (`x-webhook-secret` ou assinatura HMAC da AbacatePay, conforme a doc atual do provedor); remover `?webhookSecret=`.
- [ ] Comparar em tempo constante (`crypto.subtle` HMAC + comparação byte a byte, ou `timingSafeEqual`).
- [ ] Exigir pedido existente em `billing_orders` com `status = 'PENDING'`; sem pedido, responder 200 ignorado e logar. Remover fallback para `billing.metadata.userId/planId`.
- [ ] Usar `plan_id` e `amount_cents` do pedido, não do payload; conferir que o valor pago bate com `amount_cents`.
- [ ] Idempotência: se o pedido já está `PAID`, retornar 200 sem estender o plano. Atualizar pedido e perfil na mesma operação (RPC SQL ou ordem pedido→perfil com checagem do `update` retornado).
- [ ] Tratar `error` dos `update`; responder 500 para o provedor reenviar.
- [ ] Limitar tamanho do corpo e fazer `try/catch` no `req.json()` (400 em JSON inválido).
- [ ] Não devolver `activatedUserId` na resposta.

Verificação: testes Deno (ou script) cobrindo segredo errado, sem pedido, valor divergente, replay, JSON inválido, caso feliz.

### 1.2 RLS do paywall (achado 2)
Arquivo novo: `supabase/migrations/20261107000000_paywall_rls.sql` (não editar a migration inicial).

- [ ] Criar função `public.has_active_pro(uid uuid) returns boolean` (`SECURITY DEFINER`, `search_path = public`) com a mesma regra de `state-sync` (tier pro/mentor, status active/trialing, período não vencido).
- [ ] Recriar policies de INSERT e UPDATE de `user_study_states` com `AND public.has_active_pro(auth.uid())`. Manter SELECT para o titular (permite baixar dados após expirar).
- [ ] `CHECK (octet_length(state_json::text) <= 5242880)` (5 MB; ajustar ao maior backup real) e `CHECK (schema_version BETWEEN 1 AND 1000)`.
- [ ] Revogar `INSERT/UPDATE/DELETE` de `anon` e `authenticated` em `profiles`, `billing_orders` e `user_state_snapshots` (`REVOKE ... FROM anon, authenticated`) para blindar contra policy adicionada por engano.
- [ ] Teste SQL (pgTAP ou script): usuário free não grava; Pro grava; usuário A não lê/grava estado de B; usuário não altera o próprio `plan_tier`.

---

## Fase 2: Edge Functions (Média)

### 2.1 `state-sync` (achado 3)
- [ ] Rejeitar corpo maior que o limite (ler `Content-Length` e checar `serialized.length`) com 413.
- [ ] Validar `stateJson`: objeto, `schemaVersion` inteiro em faixa, sem chaves `__proto__`/`constructor`; reaproveitar as regras de `src/storage/backup-validator.ts` se der para importar sem acoplar ao DOM, senão checagem mínima de forma.
- [ ] `try/catch` em `req.json()`.
- [ ] Erros genéricos ao cliente (`"Falha ao salvar."`); detalhe só em `console.error`.
- [ ] `clientUpdatedAt`: validar como data ISO.

### 2.2 `abacatepay-checkout` (achado 4)
- [ ] Validar `customer`: e-mail por regex simples, `taxId` só dígitos (11/14), `cellphone` só dígitos, `name` com tamanho máximo.
- [ ] Erro da AbacatePay: logar no servidor, devolver mensagem genérica 502.
- [ ] Padrão de `APP_BASE_URL`: remover o fallback do GitHub Pages; falhar com 500 se a variável não existir.
- [ ] Rate limit simples: recusar se o usuário já tem pedido `PENDING` criado nos últimos 60 s (consulta em `billing_orders`).
- [ ] Se o `insert` em `billing_orders` falhar, retornar erro (hoje o checkout é devolvido sem pedido e o webhook não conseguiria casar).

### 2.3 CORS (achado 5)
- [ ] Ler `ALLOWED_ORIGINS` do ambiente (`https://extratoestudos.com.br,https://www.extratoestudos.com.br`); devolver `Access-Control-Allow-Origin` só se a origem estiver na lista, com `Vary: Origin`. Extrair um helper em `supabase/functions/_shared/cors.ts` usado pelas duas funções (o webhook não precisa de CORS).
- [ ] Documentar a variável em `.env.example`.

### 2.4 Dependência não fixada (achado 6)
- [ ] Trocar `https://esm.sh/@supabase/supabase-js@2` por versão exata (ex.: `@2.x.y` atual, mais de 2 semanas) nas três funções, preferencialmente num `_shared/supabase.ts` único.
- [ ] Opcional: `deno.json` com import map e `deno.lock` commitado.

---

## Fase 3: cabeçalhos HTTP e CSP (achados 7, 8, 9)

### 3.1 Cabeçalhos no Cloudflare (achado 7)
- [ ] Confirmar o alvo de produção (Cloudflare via `wrangler.jsonc`) e se `dist/_headers` existe; o build (`scripts/build-prod.mjs`) deve gerar `dist/_headers`.
- [ ] Conteúdo: `Content-Security-Policy` (mesma da meta, mais `frame-ancestors 'none'`), `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-cache` para `/service-worker.js`.
- [ ] Espelhar o mesmo bloco em `vercel.json` (hoje sem CSP/HSTS) para os dois hosts ficarem iguais.
- [ ] Teste unitário que compara a CSP do `_headers`/`vercel.json` com a do `index.html` (padrão do teste existente em `remote-sync-provider.test.js`).
- [ ] Atualizar `SECURITY-AUDIT.md`.

### 3.2 `connect-src https:` (achado 8)
- Decisão consciente por causa do WebDAV; manter. Ação: documentar o risco residual em `SECURITY-AUDIT.md` e, quando o SaaS entrar, avaliar opção de WebDAV só via domínios cadastrados. Sem mudança de código agora.

### 3.3 `style-src-attr 'unsafe-inline'` (achado 9)
- [ ] Inventariar atributos `style` dinâmicos (`grep "style=\""` em `src`), classificar: largura de barra, cor de gráfico, outros.
- [ ] Migrar para custom properties via `element.style.setProperty` (permitido pela CSP, pois é CSSOM) ou classes utilitárias; trocar `style="width:X%"` por `data-*` + aplicação em JS após render.
- [ ] Remover `style-src-attr 'unsafe-inline'`, rodar e2e e visual (`npm run test:visual`).
- Esforço grande e risco visual; fazer por último e em PR próprio.

---

## Fase 4: front-end defensivo (Baixa)

### 4.1 `innerHTML` sem escape garantido (achado 10)
- [ ] Regra ESLint local (`no-restricted-syntax`) proibindo atribuição de template literal a `innerHTML` fora de uma allowlist de renderers; ou helper `html\`...\`` que escapa por padrão.
- [ ] Revisão dirigida dos 143 pontos: priorizar os que recebem texto do usuário (nomes de matéria/tópico, notas, importações CSV/JSON): `question-import`, `structured-import`, `exam-import`, `search-controller`, `session-modal-controller`.
- [ ] Teste: importar backup com `<img src=x onerror=...>` em nomes, notas e ids e verificar que nada executa (e2e Playwright).
- [ ] Avaliar Trusted Types (`require-trusted-types-for 'script'`) como meta-objetivo.

### 4.2 Ações delegadas e aspas (achado 11)
- [ ] Reproduzir primeiro: criar tópico/matéria com id contendo `'` e `,` via backup e observar o parse em `delegated-actions.ts`.
- [ ] Se confirmado: ao interpolar valores em `data-delegated-*`, usar `encodeURIComponent` ou passar o id em `data-id` lido pelo handler, em vez de dentro da expressão. No validador de backup, restringir ids a `/^[A-Za-z0-9_-]{1,64}$/`.
- [ ] Teste unitário no resolver e no validador.

### 4.3 Rollback no WebDAV (achado 12)
- [ ] Mover `createdAt` para dentro do texto cifrado (e manter cópia fora só como dica) e comparar com `lastSync.envelopeAt`; recusar versão mais antiga que a última sincronizada sem confirmação explícita.
- [ ] Compatibilidade: envelopes v1 sem o campo interno continuam aceitos; novos gravam `version: 2`. Teste de round-trip v1→v2.

### 4.4 Força da passphrase (achado 13)
- [ ] No `remote-sync-controller.ts`, exigir mínimo de 12 caracteres e mostrar aviso de força na UI (sem dependência nova; checagem de tamanho + variedade).
- [ ] Mensagem clara de que perder a frase significa perder o backup remoto.
- [ ] Teste unitário da regra.

---

## Gates de conclusão (cada fase)
- `npm run lint`, `npm run check:types`, `npm test`, `npm run check:bundle`.
- Fases 3 e 4: `npm run test:e2e` e `npm run test:visual` quando tocar UI.
- Fases 1 e 2: testes das funções e SQL conforme descrito; teste manual em projeto Supabase de staging com webhook simulado.
- Após código: `graphify update .`.
- Commits pequenos por tarefa, `git add` só dos arquivos tocados, push direto no `main`.

## Fora do escopo / riscos
- Não foi feito teste dinâmico nem pentest; este plano parte de revisão estática.
- Pode haver `SECURITY DEFINER` ou policies fora da migration inicial que não foram lidas.
- Segredos já usados em ambiente real (se existirem) devem ser rotacionados antes do lançamento: `ABACATEPAY_WEBHOOK_SECRET`, `ABACATEPAY_API_KEY`.
- Pipelines de deploy (CI) não foram auditados.
