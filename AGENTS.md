# StudyTrack — Governança, Engenharia e Estratégia de Testes

As instruções explícitas do usuário prevalecem sobre esta política. Consulte [a estratégia de testes](docs/TEST-STRATEGY.md), [o inventário](docs/TEST-SUITE-INVENTORY.md) e [a política visual](docs/VISUAL-TEST-POLICY.md).

## Pilha Tecnológica e Diretrizes Inegociáveis de Engenharia

- **Modularização Obrigatória (Zero Novas Funções no `app.ts`):** É terminantemente proibido adicionar novas funções ou concentrar regras de negócio em `src/app.ts`. O projeto deve ser totalmente modularizado: regras e cálculos puros pertencem a `src/domain/`, orquestrações e casos de uso a `src/application/`, componentes e interfaces reativas a `src/ui/`, e persistência a `src/storage/` ou `src/repositories/`. O arquivo `src/app.ts` atua unicamente como raiz de composição (*composition root*) e conexão de ciclo de vida, devendo ser progressivamente reduzido e desmembrado, nunca inflado.
- **Fronteiras e Isolamento de Camadas:**
  - `src/domain/`: puramente algorítmico e determinístico em TypeScript (`.ts`), sem dependências de DOM, Preact, `window`, IndexedDB ou storage.
  - `src/application/`: orquestra casos de uso, fluxo de dados e persistência através de repositórios, sem manipular diretamente elementos de UI.
  - `src/ui/`: consome view-models e controllers de aplicação; é proibido acessar storage/repositórios diretamente ou recalcular métricas/regras de negócio nos componentes.
- **Tipagem Estática Obrigatória:** Todo código novo de domínio (`src/domain/`) e aplicação (`src/application/`) deve ser escrito em TypeScript (`.ts`) e validado com `npm run check:types`.
- **Interface Declarativa e Tokens:** Novas interfaces devem ser componentes Preact 11 (`.tsx`), consumindo as primitivas compartilhadas (`src/ui/primitives/*.tsx`) e estilizadas via Tailwind CSS v4 integrado a `styles/tokens.css`. É vedado o uso de `innerHTML` ou strings HTML interpoladas.
- **Design System, Dark Mode e Acessibilidade (WCAG AA):**
  - Proibido o uso de cores ou valores hexadecimais soltos no JSX/CSS. Utilize estritamente os design tokens semânticos de `styles/tokens.css` via classes utilitárias (ex: `bg-surface-elevated`, `text-content-primary`), garantindo contraste adequado e suporte total aos temas Claro e Escuro.
  - Todo elemento interativo ou campo de formulário deve conter identificação acessível (`aria-label`, texto visível ou `aria-labelledby`) e suporte à navegação por teclado.
- **Estratégia de Testes Proporcional:**
  - **Regras de negócio e algoritmos:** Testes unitários no Node rodando com hook nativo (`npm run test:fast`). Meta: < 120s.
  - **Jornadas centrais de UI:** Testes E2E dirigidos no Playwright para fluxos críticos, sem inflar a matriz browser desnecessariamente.
  - **Execuções completas (`npm run test:full`):** Reservadas para releases e mudanças estruturais de esquema/persistência.

## Integridade de Dados, Contratos e Fusos Horários

- **Simulações Sem Efeitos Colaterais:** Modais de prévia, simuladores (*What-If*, *Modo Reta Final*), prévias de importação e diagnósticos operam em memória e jamais persistem ou alteram o estado real (`studyPlans`, histórico ou sessões) sem uma confirmação explícita do usuário.
- **Imutabilidade Histórica:** Fechamentos semanais/mensais passados, backups e snapshots históricos consolidados são imutáveis; mudanças em metas ou algoritmos atuais não devem recalcular ou reescrever dados de períodos encerrados.
- **Evolução Segura de Schema e Migrações:** Toda alteração no formato do estado exige migração sequencial pura e determinística em `src/state/migrations/` (ou `src/storage/`), acompanhada de testes unitários cobrindo a evolução a partir de schemas legados (v1 em diante).
- **Tratamento Rigoroso de Datas (Dual Timezone UTC / SP):** É proibido utilizar `new Date().toISOString()` cru para lógica de calendário civil. Sempre utilize as utilidades centralizadas em `src/core/dates.ts` e `src/core/clock.ts`, separando instantes UTC de datas civis locais (`YYYY-MM-DD`) para garantir que os cálculos funcionem identicamente em `UTC` e `America/Sao_Paulo`.

## Durante a implementação

1. Execute o menor conjunto relevante para a área alterada. Prefira Node para regras de negócio e integração de serviços.
2. Preserve testes de persistência, migração, datas locais, capacidade, atomicidade, reconciliação e snapshots históricos.
3. Use E2E para jornadas e sua interação com a aplicação. Não repita toda a matemática em uma matriz browser.
4. Não execute automaticamente a suíte E2E completa nem a matriz visual após cada alteração.
5. Execute a Demo browser densa quando alterar Demo, planejamento, análises históricas, trajetória ou seus contratos; mudanças isoladas de texto/ícone/espaçamento não exigem a auditoria completa da Demo.
6. Se um teste falhar, corrija e reexecute primeiro o caso falho, depois os relacionados. Uma falha isolada não é motivo para iniciar Full.
7. Nunca adicione novas funções em `src/app.ts`. Estruture novas funcionalidades em módulos dedicados (`src/domain/`, `src/application/`, `src/ui/`, etc.) para garantir a modularização contínua do projeto.

## Antes de concluir uma tarefa normal

- Execute `npm run test:fast` e os testes da área afetada. Use a seleção por impacto quando disponível, mas confira o conjunto escolhido.
- Não considere uma seleção vazia ou arquivo desconhecido como autorização para pular testes.
- Ao criar novos arquivos de teste, classifique-os obrigatoriamente em `tests/config/test-tiers.json` e audite com `node scripts/check-test-tiers.mjs`.
- Reproduza artefatos com `npm run build` quando necessário; não edite bundles (`src/app.bundle.js`, `report.bundle.js`, etc.), HTML versionado ou service worker gerados manualmente.
- Relate quais comandos passaram, o tempo medido quando disponível e o que não foi executado. Um gate local não confirma o GitHub Actions.
- Documentação apenas em Markdown pode ser validada com revisão de referências, sem testes da aplicação, salvo instrução do usuário.

## Quando executar Full

Execute `npm run test:full` quando solicitado, preparando release ou alterando persistência/migrações, semântica de snapshots históricos, contratos globais de dados ou uma grande refatoração da aplicação que atravesse vários motores. Essas alterações exigem validação ampla mesmo quando uma seleção de área passa.

Full preserva todos os casos. Em Windows, inclui as referências visuais dessa plataforma. No CI Ubuntu, o job Windows separado valida as superfícies visuais oficiais. Não atualize snapshots automaticamente para ocultar uma falha: inspecione a imagem e o diff primeiro.

## Escolha de cobertura nova

- Regra de negócio → Node.
- Integração crítica → teste de serviços/contratos no Node.
- Jornada principal → E2E.
- Mudança visual relevante → comparação visual da superfície afetada.

Não exigir automaticamente Node + integração + E2E + Demo + cinco screenshots para cada funcionalidade. Não excluir um teste por ser lento sem revisar o contrato protegido. Não tratar retries como correção de flakiness.

## Orçamentos

Fast: meta 120 s, máximo de referência 180 s. Regression: meta 420 s, máximo de referência 600 s. Full: custo monitorado. Instalação e fila do CI são medidos separadamente. Se o gate ultrapassar o orçamento, revise o custo antes de ampliar sua seleção.
