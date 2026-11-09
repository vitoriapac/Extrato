# Redesign visual do Extrato (conciliação, filas e livro-razão) — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** tornar números e filas do app legíveis e mais modernos sem mudar a identidade de extrato: toda cifra declara período e base, e o excedente fica nomeado.

**Arquitetura:** helpers puros de conciliação (testáveis) alimentam componentes Preact existentes; uma classe CSS única de "linha de razão" (valor mono tabular + guia pontilhada) é reutilizada nas telas tocadas. Nenhuma regra de cálculo de domínio muda; só apresentação e rótulos.

**Stack:** TypeScript strict, Preact `.tsx`, CSS em `styles/app.css` e tokens em `styles/tokens.css`, testes `node:test` em `tests/unit`, E2E Playwright.

**Spec:** [auditoria visual](C:/Users/vitor/.claude/uploads/29a4960d-d6e6-4212-b1c7-96e32218b113/b43be659-auditoria-visual-extrato-2026-11-07.md), [DESIGN.md](../../../DESIGN.md) e o mockup [docs/mockups/visao-geral-redesenhada.html](../../mockups/visao-geral-redesenhada.html) (usado **só** como referência de conciliação, guia pontilhada e filas; a Visão geral dele NÃO é implementada).

## Restrições globais

Decididas pela usuária; valem para toda tarefa:

- **Não mexer no cabeçalho do extrato** (hero e barra compacta `sticky-shell`, faixa musgo, saldo, anel, textura de linhas verticais) nem em nenhum arquivo que o renderize.
- **Não mexer nas informações da Visão geral** (aba `dashboard`): conteúdo, ordem, rótulos e blocos ficam como estão. O diff final não pode incluir `src/ui/tabs/dashboard/**`.
- **O calendário mensal da Agenda permanece no desktop.** Só abaixo de 760px a visão Lista pode virar o padrão; "Mês" continua escolhível.
- `DESIGN.md`: só tokens de papel (`--surface-*`, `--text-*`, `--status-*`), raios 8px/6px, sem sombra em card em repouso, sem gradiente novo, sem `border-left` colorido, estado sempre com texto, Mono só para número/data/duração, 12px é o piso, alvos de 44px em toque, funcionar a 320px sem rolagem horizontal, `prefers-reduced-motion`.
- Terminologia fixa e copy permanente de 1–2 frases (`docs/MICROCOPY-CONTRACT.md`); explicações extras em disclosures. pt-BR.
- Regras de produto preservadas: prévia antes de salvar, evidência insuficiente declarada, retratos históricos não recalculados.
- Não editar bundles (`src/*.bundle.js`) nem o service worker à mão; `npm run build` os gera.
- Git: commits diretos em `main`, mensagens em pt-BR no estilo do repositório (`feat(ui): ...`), `git add` só dos arquivos da tarefa (nunca `-A`), terminar com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Antes de ler código: `graphify query "<pergunta>"`; depois de modificar: `graphify update .`.

## Foco de revisão

Entradas que a spec implica e nenhuma tarefa trivial cobre (cada uma tem teste na tarefa dona):

1. Disponibilidade = 0 com plano > 0 (excedente sem base): não dividir por zero, dizer "sem disponibilidade declarada". (T2)
2. Realizado maior que o planejado por ordem de grandeza (415%): mostrar múltiplo e a linha "fora do plano", nunca só o percentual. (T3)
3. Dia sem plano montado (`progressPercent === null`): a conciliação não aparece nem mostra "Excedente 0". (T2)
4. Contagem de vencidas que mistura revisões e tarefas: soma dos tipos sempre igual ao total exibido. (T4)
5. Tema escuro e 320px: guia pontilhada e valores não estouram nem somem. (T1, T8)

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `styles/app.css` | classe `.ledger-line` (guia pontilhada + valor tabular); remover textura de página; limpar `.onboarding-entry` |
| `src/ui/primitives/ledger-line.tsx` (novo) | componente `LedgerLine` reutilizado por Hoje e Planejamento |
| `src/ui/tabs/today/day-reconciliation.ts` (novo) | `buildDayReconciliation` (puro) |
| `src/ui/tabs/today/TodayExecutionSummary.tsx` | usa a conciliação; remove "Falta no plano" |
| `src/ui/tabs/goals/week-reconciliation.ts` (novo) | `buildWeekReconciliation` (puro) |
| `src/ui/tabs/goals/PlanExecutionCard.tsx` | mostra capacidade / planejado / fora do plano / realizado |
| `src/ui/components/ReviewQueueSummary.tsx` + `src/ui/tabs/reviews/*` | contagens por tipo e período; filas |
| `index.html`, `src/ui/controllers/demo-controller.ts` | rótulo e feedback do botão Relatório |
| `src/ui/tabs/subjects/SubjectBlock.tsx` | linhas compactas fechadas por padrão |
| `src/ui/tabs/questions/*` | três tópicos críticos com amostra primeiro |
| `DESIGN.md`, `DESIGN-SYSTEM.md` | registrar a linha de razão e a remoção da textura |

---

### Task 1: Linha de razão (base visual reutilizável)

**Arquivos:**
- Criar: `src/ui/primitives/ledger-line.tsx`
- Modificar: `styles/app.css` (acrescentar a classe; remover a textura em `body`, linha 5–6)
- Testar: `tests/unit/ledger-line.test.js`

**Interfaces:**
- Produz: `LedgerLine({ label: string, value: string, hint?: string, tone?: 'neutral'|'negative'|'positive', total?: boolean }): JSX.Element`. Renderiza `<div class="ledger-line [ledger-line--total] [is-negative|is-positive]">` com `.ledger-line__label` (hint em `<small>`), `.ledger-line__lead` (decorativo, `aria-hidden`) e `.ledger-line__value`.

- [ ] **Passo 1: escrever o teste.** Em `tests/unit/ledger-line.test.js`, renderizar com `preact-render-to-string` e afirmar: contém `ledger-line__lead` com `aria-hidden="true"`; `tone: 'negative'` gera `is-negative` e o valor continua em texto (ex.: `−20min`), nunca só cor; `total: true` gera `ledger-line--total`; `hint` aparece dentro de `<small>`.
- [ ] **Passo 2:** rodar `node --import ./scripts/ts-resolve-hook.mjs --test tests/unit/ledger-line.test.js`; esperado: FALHA (módulo ausente).
- [ ] **Passo 3:** implementar `LedgerLine` em `src/ui/primitives/ledger-line.tsx` seguindo o padrão de `src/ui/primitives/button.tsx`.
- [ ] **Passo 4:** CSS em `styles/app.css`: `.ledger-line{display:flex;align-items:baseline;gap:10px}`, `.ledger-line__lead{flex:1;border-bottom:1px dotted var(--border-control);align-self:end;margin-bottom:.35em;min-width:16px}`, `.ledger-line__value{font:var(--text-small) var(--font-data);font-variant-numeric:tabular-nums;white-space:nowrap}`, `--total` com `border-top:2px solid var(--heading)`, `.is-negative .ledger-line__value{color:var(--status-negative)}`. Só tokens; vale nos dois temas.
- [ ] **Passo 5:** remover `background-image` e `background-size` do `body` (`styles/app.css:5-6`). Esta é a única mudança global; ela atinge também o fundo da Visão geral (sem alterar nenhuma informação ou o cabeçalho). Registrar isso na mensagem de commit para a usuária poder reverter só este passo.
- [ ] **Passo 6:** rodar o teste (PASSA) e `npm run check:types`.
- [ ] **Passo 7: commit** `feat(ui): linha de razão com guia pontilhada e fundo de página liso`.

### Task 2: Conciliação de Hoje

**Arquivos:**
- Criar: `src/ui/tabs/today/day-reconciliation.ts`
- Modificar: `src/ui/tabs/today/TodayExecutionSummary.tsx` (linhas do bloco `today-statement-ledger` e `today-progress-status` "Falta no plano")
- Testar: `tests/unit/day-reconciliation.test.js`, ajustar `tests/unit/today-components.test.js`

**Interfaces:**
- Consome: `LedgerLine` (T1).
- Produz: `buildDayReconciliation({ available: number, planned: number, executed: number }): { rows: Array<{ key: 'available'|'planned'|'executed'|'overrun'|'free'; label: string; minutes: number }>; overrunMinutes: number; status: 'within'|'over'|'no-availability' }`.

- [ ] **Passo 1: escrever os testes** com valores exatos da auditoria: `available 60, planned 80, executed 0` → `status 'over'`, `overrunMinutes 20`, última linha `overrun` rotulada "Excedente"; `available 90, planned 80` → `status 'within'`, linha `free` "Livre" de 10; `available 0, planned 80` → `status 'no-availability'`, sem linha de excedente numérica (Foco 1); entradas negativas ou `NaN` tratadas como 0.
- [ ] **Passo 2:** rodar; esperado FALHA.
- [ ] **Passo 3:** implementar `buildDayReconciliation` (puro, sem formatação de texto; a formatação usa `formatMinutes` já existente no componente).
- [ ] **Passo 4:** no componente, trocar as quatro linhas por `LedgerLine`: Disponível, Planejado, Estudado e Excedente (negativo, "−20min") ou Livre. Substituir o texto "Falta no plano… A disponibilidade inclui o tempo livre além do plano" por uma frase só quando `status !== 'within'`: "O plano passa N min da sua disponibilidade." com link "Ajustar o dia" para Planejamento, ou "Sem disponibilidade declarada para hoje." Quando `progressPercent === null`, não renderizar conciliação (Foco 3).
- [ ] **Passo 5:** atualizar `tests/unit/today-components.test.js` (hoje afirma "Extrato do Dia", "Disponibilidade restante" e "Falta no plano"): manter o título "Extrato do Dia", trocar as demais afirmações pelos novos rótulos.
- [ ] **Passo 6:** rodar `npm run test:unit` e `npm run check:types`; esperado: sem falhas.
- [ ] **Passo 7: commit** `feat(ui): conciliar disponibilidade, plano e estudo em Hoje`.

### Task 3: Conciliação da semana em Planejamento

**Arquivos:**
- Criar: `src/ui/tabs/goals/week-reconciliation.ts`
- Modificar: o card que exibe capacidade/planejado/estudado e "% do plano" (localizar com `graphify query "planejamento resumo capacidade planejado estudado percentual do plano"`; candidato: `src/ui/tabs/goals/PlanExecutionCard.tsx`)
- Testar: `tests/unit/week-reconciliation.test.js`

**Interfaces:**
- Consome: `LedgerLine` (T1).
- Produz: `buildWeekReconciliation({ capacityMin: number, plannedMin: number, studiedMin: number, periodLabel: string }): { capacityMin: number; plannedMin: number; offPlanMin: number; studiedMin: number; multiple: number | null; periodLabel: string }` com `offPlanMin = max(0, studied - planned)` e `multiple = planned > 0 ? studied / planned : null`.

- [ ] **Passo 1: testes** com os números da auditoria: `capacity 720, planned 160, studied 664` → `offPlanMin 504`, `multiple ≈ 4.15`; `planned 0` → `multiple null` (sem "Infinity%"); `studied < planned` → `offPlanMin 0`. Afirmar também que `periodLabel` é obrigatório e aparece em todas as linhas (mesmo intervalo, Foco 2).
- [ ] **Passo 2:** rodar; esperado FALHA.
- [ ] **Passo 3:** implementar o helper e renderizar no card as linhas Capacidade, Planejado nos dias, Estudo fora do plano e Realizado (linha total), com o período no subtítulo. Quando `multiple > 2`, uma frase: "Você estudou N× o planejado. O plano está curto." com atalho para distribuir a capacidade (ação existente; não criar fluxo novo).
- [ ] **Passo 4:** a métrica "0% de prioridade executada" ganha sua própria base: "0h de 1h30 de prioridade · esta semana", separada do bloco acima.
- [ ] **Passo 5:** rodar `npm run test:unit` e `npm run check:types`; PASSA.
- [ ] **Passo 6: commit** `feat(ui): conciliar capacidade, plano e realizado na semana`.

### Task 4: Agenda em filas rotuladas (calendário mantido)

**Arquivos:**
- Modificar: `src/ui/components/ReviewQueueSummary.tsx`, `src/ui/tabs/reviews/reviews-tab-controller.ts` (`agendaViewModel`, linha ~245), `src/ui/tabs/calendar/calendar-tab-controller.ts` (somente o padrão da visão no mobile)
- Testar: `tests/unit/review-queue-summary.test.js` (novo)

**Interfaces:**
- Produz: `buildAgendaBuckets(items): { overdue: { total; reviews; tasks }; today: { total; reviews; tasks }; next7: { total; reviews; tasks } }` em `src/application/reviews/build-agenda-buckets.ts`, sem alterar `buildReviewQueueSummary`.

- [ ] **Passo 1: teste** com 74 itens da auditoria: `overdue` = 9 com `reviews 7` e `tasks 2`; `today 1`; `next7 14`; afirmar `total === reviews + tasks` em toda fila (Foco 4).
- [ ] **Passo 2:** rodar; esperado FALHA.
- [ ] **Passo 3:** implementar `buildAgendaBuckets` reutilizando as regras de data já usadas por `agendaViewModel` (não criar um segundo critério de "atrasada").
- [ ] **Passo 4:** no topo da Agenda, três contagens "Vencidas · Hoje · Próx. 7 dias", cada uma com a quebra por tipo ("7 revisões + 2 tarefas"). `ReviewQueueSummary` passa a citar o período ("hoje ou atrasadas") sem repetir números que contradizem as filas.
- [ ] **Passo 5:** **manter** o calendário mensal e as visões Mês/Lista. Em `<760px` o padrão inicial passa a ser Lista; a escolha lembrada da usuária continua mandando. Teste: viewport 1280 abre em Mês, 375 abre em Lista.
- [ ] **Passo 6:** `npm run test:unit` e `npx playwright test tests/e2e --grep -i "agenda|calend"`; PASSA.
- [ ] **Passo 7: commit** `feat(ui): filas rotuladas por tipo e período na Agenda`.

### Task 5: Botão Relatório da demonstração

**Arquivos:**
- Modificar: `index.html:32` (rótulo), `src/ui/controllers/demo-controller.ts:85`
- Testar: `tests/unit/demo-controller.test.js` (novo) ou E2E existente da demo

**Contexto:** `demoReportShortcut` só faz `exportReportBtn.click()` (exporta PDF), sem navegar; por isso a auditoria viu a tela parada.

- [ ] **Passo 1:** conferir se `#exportReportBtn` (`index.html:794`) está dentro de painel oculto quando o atalho é usado; se estiver, o clique não faz nada. Registrar a causa no commit.
- [ ] **Passo 2: teste:** acionar o atalho chama o handler de exportação e mostra aviso (`toast`) "Gerando relatório PDF…".
- [ ] **Passo 3:** rótulo "Exportar relatório (PDF)" e aviso de feedback; se o botão estiver oculto, chamar a função de `report-controller.ts` diretamente.
- [ ] **Passo 4:** rodar teste e `npm run check:types`; PASSA.
- [ ] **Passo 5: commit** `fix(ui): deixar claro e acionável o atalho de relatório da demo`.

### Task 6: Disciplinas em linhas compactas

**Arquivos:**
- Modificar: `src/ui/tabs/subjects/SubjectBlock.tsx`, `SubjectsTab.tsx`, CSS correspondente
- Testar: `tests/unit/subjects-tab.test.js` (existente ou novo)

- [ ] **Passo 1: teste:** nenhuma disciplina vem expandida por padrão; cada linha fechada mostra nome, progresso (texto + barra), acerto recente em Mono e a ação "Abrir tópicos".
- [ ] **Passo 2:** rodar; esperado FALHA (hoje a primeira vem aberta).
- [ ] **Passo 3:** fechar por padrão (respeitando a escolha lembrada em `data-remember`); a tabela de tópicos só renderiza aberta. Abaixo de 760px, cada tópico vira cartão rotulado sem rolagem lateral.
- [ ] **Passo 4:** cor da disciplina vira traço de 4px sem `border-left` colorido (usar bloco decorativo `aria-hidden` à esquerda do nome), nome sempre escrito.
- [ ] **Passo 5:** `npm run test:unit`, E2E de disciplinas; PASSA.
- [ ] **Passo 6: commit** `feat(ui): disciplinas compactas e fechadas por padrão`.

### Task 7: Questões com tópicos críticos primeiro

**Arquivos:**
- Modificar: `src/ui/tabs/questions/questions-tab-controller.ts`, `question-analytics-controller.ts`, `PlateauDetectorCard.tsx`
- Testar: `tests/unit/question-weak-topics.test.js` (novo)

- [ ] **Passo 1:** localizar com `graphify query "questões tópicos com menor acerto e amostra"`; reutilizar o cálculo existente, não duplicar.
- [ ] **Passo 2: teste:** devolve no máximo 3 tópicos ordenados por menor acerto, cada um com `sampleSize` e período; tópico com amostra pequena sai marcado "evidência insuficiente" em texto.
- [ ] **Passo 3:** exibir esse bloco antes da tabela; calibração e auditoria dentro de `details.decision-fold` (lembrado pelo navegador); separar Questões e Simulados em subabas internas.
- [ ] **Passo 4:** `npm run test:unit` e E2E de questões; PASSA.
- [ ] **Passo 5: commit** `feat(ui): tópicos críticos com amostra no topo de Questões`.

### Task 8: Acabamento, documentação e verificação final

**Arquivos:**
- Modificar: `styles/app.css` (`.onboarding-entry`, linha ~1935: remover `linear-gradient` e `box-shadow`, usar `--surface-card` e borda de 1px), `DESIGN.md`, `DESIGN-SYSTEM.md`

- [ ] **Passo 1:** corrigir `.onboarding-entry` conforme as regras do `DESIGN.md` (sem gradiente, sem sombra em repouso).
- [ ] **Passo 2:** documentar em `DESIGN.md` a **linha de razão** (guia pontilhada, valor tabular) e a remoção da textura de página; manter a textura de linhas verticais do cabeçalho como única.
- [ ] **Passo 3:** `npm run build`, `npm run check:bundle`, `npm run lint`, `npm run check:types`, `npm run test:unit`; esperado: tudo verde.
- [ ] **Passo 4:** `impeccable detect --json` nos arquivos alterados; corrigir achados reais.
- [ ] **Passo 5:** E2E de acessibilidade e responsivo (`npx playwright test tests/e2e --grep -i "axe|a11y|mobile"`) e conferência visual a 1280, 375 e 320px, claro e escuro; calendário visível no desktop.
- [ ] **Passo 6:** `git diff --stat origin/main` **não** pode listar `src/ui/tabs/dashboard/**` nem arquivos do cabeçalho; se listar, reverter.
- [ ] **Passo 7:** `graphify update .`.
- [ ] **Passo 8: commit** `docs(ui): documentar linha de razão e acabamento visual`.

---

## Revisão própria

- **Cobertura:** P0 números (T2, T3, T4), Relatório (T5), Disciplinas e Questões (T6, T7), identidade e ruído (T1, T8). Fora de escopo por decisão da usuária: Visão geral, cabeçalho e remoção do calendário.
- **Consistência de tipos:** `LedgerLine` (T1) é consumido em T2 e T3; `buildDayReconciliation` e `buildWeekReconciliation` têm assinaturas próprias; `buildAgendaBuckets` não altera funções existentes.
- **Ponto de atenção:** a remoção da textura de página (T1, passo 5) é global e atinge visualmente o fundo da Visão geral; está isolada em um passo para poder ser revertida.
