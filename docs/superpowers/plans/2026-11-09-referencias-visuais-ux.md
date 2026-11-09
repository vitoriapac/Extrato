# Plano de implementação — referências visuais e experiência

**Objetivo:** tornar a próxima decisão mais clara no aplicativo e demonstrar seu valor na landing, preservando a identidade e os contratos do Extrato.

**Base:** análise de Leruma, Bizzu e Estudei nesta conversa; [PRODUCT.md](../../../PRODUCT.md) e [DESIGN.md](../../../DESIGN.md). A análise das referências usou suas páginas públicas; a interface atual do Extrato ainda precisa de inspeção visual antes de se fixar cada alteração.

**Tecnologia:** Preact, TypeScript, Tailwind v4, tokens existentes e Playwright. Não acrescentar dependências.

## Limites e decisões

- Manter musgo, papel, Fraunces, Plex, metáfora do extrato, abas no topo do desktop e navegação inferior no celular. Aplicar mais respiro e hierarquia sem trocar a identidade visual.
- Visão geral resume; Hoje conduz a execução; Desempenho oferece análise detalhada. Uma única prioridade deve continuar vindo do cálculo existente.
- Não criar recursos de concorrentes, prometer aprovação, inventar depoimentos ou resultados, nem alterar cálculos, dados históricos ou persistência para alcançar o efeito visual.
- Novas interfaces em Preact, primitivas e tokens; nenhum emoji, cor literal, HTML interpolado ou nova função em `src/app.ts`. Manter acessibilidade por teclado, contraste AA, temas e uso a partir de 320 px.
- Preservar prévias e confirmação de alterações, evidência insuficiente e limites das recomendações. Não usar capturas de dados pessoais.
- O checkout contém alterações anteriores e possivelmente simultâneas, inclusive nos componentes abaixo. Antes de cada etapa, inspecionar `git status` e os diffs; incorporar o estado atual e não sobrescrever trabalho alheio. Não editar artefatos gerados manualmente.
- Não implementar este plano automaticamente: cada fase pode ser aprovada e entregue separadamente. Capturas e decisões de composição devem ser verificadas com dados reais de demonstração antes da implementação final.

## Validação inicial e direção

- [ ] Subir a versão local vigente com o procedimento do projeto e examinar Visão geral, Hoje, Desempenho, primeiro acesso e landing. Registrar capturas de desktop e celular, claro e escuro, incluindo Demo densa e estado inicial vazio; não presumir que o design documentado corresponda ao estado renderizado.
- [ ] Comparar capturas com os componentes e alterações existentes. Anotar elementos duplicados, ação dominante, conteúdo acima da primeira dobra, overflow e diferenças que realmente prejudiquem a leitura. Manter o que já atende ao objetivo.
- [ ] Definir uma composição de referência para Visão geral e landing: ação principal, conteúdo de apoio, hierarquia e uso de imagens reais. Revisar no contexto de 320/375 px e desktop antes de propagar a direção. Não ampliar o escopo para uma troca de marca.

## Fase 1 — Visão geral: decisão primeiro

**Arquivos candidatos:** `src/ui/tabs/dashboard/NextActionCard.tsx`, `src/ui/tabs/dashboard/dashboard-tab-controller.ts`, componentes de apoio em `src/ui/tabs/dashboard/`, estilos existentes em `styles/`; testes `tests/unit/next-action-card.test.js`, `tests/unit/dashboard-components.test.js`, `tests/e2e/ux-baseline.spec.js` e `tests/e2e/visual-regression.spec.js`. Confirmar responsáveis e seletores na implementação.

- [ ] Reorganizar visualmente o cartão existente para apresentar, nesta ordem: próxima ação, justificativa curta fornecida pelo modelo, ação principal e acesso à explicação. Manter duração, contexto e evidências acessíveis, sem criar uma segunda recomendação.
- [ ] Usar espaço e tipografia para subordinar indicadores e evitar caixas aninhadas; conservar os resumos de prontidão e saúde do edital e os destinos já existentes.
- [ ] Conferir estados de primeiro acesso, sem recomendação, ação bloqueada, sessão em andamento e evidência insuficiente. Nenhum estado pode sugerir uma ação indisponível ou esconder seu motivo.
- [ ] Ajustar os testes existentes se a estrutura ou os nomes acessíveis mudarem. Executar os testes Node dos componentes e os casos dirigidos de próxima ação e composição; inspecionar screenshots Windows afetados antes de qualquer atualização de referência.

**Aceite:** a ação disponível e seu motivo são reconhecíveis antes dos indicadores secundários; teclado e links continuam operantes; estados vazios e limites continuam claros.

## Fase 2 — Hoje: começar e continuar

**Arquivos candidatos:** `src/ui/tabs/today/today-tab-controller.ts`, `TodayAgendaSections.tsx`, `TodayGoalsCard.tsx`, `TodayExecutionSummary.tsx`, estilos existentes; testes `tests/unit/today-components.test.js` e `tests/e2e/daily-execution.spec.js`.

- [ ] Examinar o fluxo atual de iniciar/retomar e a ordem dos blocos. Dar destaque à atividade que já é prioritária; organizar o restante como próximos itens e progresso, sem mudar a ordenação calculada ou criar novo fluxo.
- [ ] Preservar acesso a tarefas, revisões atrasadas, simulados, metas e recuperação; evitar que ações secundárias tenham o mesmo peso visual da atividade principal.
- [ ] Verificar nenhum item, atividade em andamento, plano concluído, listas longas e títulos extensos em celular e desktop; manter estados textuais e alvos de toque.
- [ ] Executar testes Node pertinentes e a jornada dirigida de execução diária; revisar as referências de Hoje afetadas conforme a política visual. Executar a Demo browser densa se a alteração alcançar seus contratos ou composição funcional, conforme AGENTS.md.

**Aceite:** é fácil identificar o que iniciar ou retomar, o progresso permanece legível e nenhuma ação já disponível desaparece.

## Fase 3 — Landing: mostrar o produto em situações reais

**Arquivos candidatos:** `src/landing.tsx`, estilos e assets utilizados pela landing; identificar a fonte de `landing.html` e o fluxo de geração em `scripts/build.mjs` antes de alterar. Verificar testes de landing existentes e os destinos atuais dos CTAs.

- [ ] Na primeira dobra, apresentar uma proposta precisa, uma ação principal existente e uma captura legível da interface real com dados fictícios. Manter o acesso ao produto e à demonstração funcionando como hoje.
- [ ] Apresentar três situações curtas com recortes reais: decidir o que estudar, adaptar a semana mediante prévia e confirmação, e entender a evolução com evidências e limites. Não representar exemplos como resultados de usuários reais.
- [ ] Usar uma pequena galeria de capturas claro/escuro e computador/celular apenas se a inspeção confirmar que as imagens permanecem legíveis; fornecer texto alternativo e controles por teclado. Evitar carrossel automático como requisito.
- [ ] Gerar capturas de uma versão local estável com Demo isolada, sem dados pessoais; conferir conteúdo, legibilidade e tamanho. Reproduzir artefatos com `npm run build`, nunca editar bundles ou HTML gerado manualmente.
- [ ] Verificar CTAs, foco, imagens, overflow e leitura em 320/375 px e desktop nos temas aplicáveis. Executar testes de landing existentes ou uma jornada dirigida apenas se não houver cobertura dos destinos alterados.

**Aceite:** a pessoa vê o produto e entende as três situações sem depender de animação, e a demonstração e os CTAs levam aos destinos corretos.

## Fase 4 — Desempenho: conclusão e evidência

**Arquivos candidatos:** `src/ui/tabs/performance/performance-tab-controller.ts`, `src/ui/performance/performance-overview-renderer.ts`, `src/application/performance/build-performance-overview.ts`, estilos existentes; `tests/unit/performance-tab-controller.test.js` e `tests/e2e/refinement-visual.spec.js`.

- [ ] Partir do resumo e do modelo existentes. Dar destaque à conclusão já calculada e mostrar evidência, período e limites em seguida ou em disclosure acessível; preservar as subabas e análises.
- [ ] Conferir ausência de dados, evidência insuficiente, valores extremos e nomes longos. Não fabricar conclusões nem alterar a semântica de Prontidão, projeção ou históricos.
- [ ] Executar testes existentes de componentes/modelo afetados e os casos visuais dirigidos de Desempenho; comparar imagens e diffs em Windows antes de atualizar referências.

**Aceite:** a conclusão é compreensível, a pessoa pode chegar à evidência e aos limites, e os dados e destinos permanecem inalterados.

## Fase 5 — Primeiro uso e demonstração

**Arquivos candidatos:** `src/ui/components/FirstAccessModal.tsx`, `src/ui/controllers/first-access-modal-controller.ts`, `src/domain/onboarding/guided-tour-steps.ts`, `src/ui/controllers/guided-tour-controller.ts`, `src/ui/controllers/demo-controller.ts`; testes `tests/unit/first-access-modal.test.js`, `tests/unit/demo-controller.test.js`, `tests/e2e/onboarding.spec.js` e `tests/e2e/demo.spec.js`.

- [ ] Avaliar as orientações já existentes antes de acrescentar passos. Usar apenas instruções curtas e contextuais para indicar a primeira decisão útil e a diferença entre Visão geral, Hoje e Desempenho.
- [ ] Se forem úteis, reutilizar recortes da fase 3 no material de apresentação; não inserir imagens ou anotações permanentes na rotina. Preservar navegação, saída e retorno do tour e isolamento da Demo.
- [ ] Exercitar primeiro acesso, pular/fechar tour, reentrada e acesso à Demo; confirmar que nenhum dado de demonstração é gravado no estado real. Executar os testes dirigidos de onboarding e Demo e a Demo browser densa quando houver mudança no fluxo ou contrato.

**Aceite:** a pessoa entende como chegar à primeira ação, consegue sair e retornar sem perda e distingue a demonstração dos seus dados.

## Encerramento de cada fase

- [ ] Executar `npm run test:fast`, testes dirigidos da área e `npm run check:types` quando houver código TypeScript; medir e relatar tempos e falhas. Conferir o conjunto da seleção por impacto, caso usada.
- [ ] Para mudanças visuais relevantes, inspecionar a superfície alterada em desktop/celular e claro/escuro, além dos casos dirigidos oficiais em Windows/Chromium. Comparar expected, actual e diff antes de aceitar referências; não executar automaticamente a matriz visual inteira.
- [ ] Se criar arquivo de teste, classificá-lo em `tests/config/test-tiers.json` e executar `node scripts/check-test-tiers.mjs`. Rodar `npm run build` quando necessário e atualizar o grafo após mudanças de código, conforme as instruções do projeto.
- [ ] Registrar comandos, tempo e o que não foi executado. Reservar `npm run test:full` para as condições previstas em AGENTS.md; gate local não confirma CI.

## Riscos de revisão

1. **Dados insuficientes:** manter texto de limite visível e não exibir conclusão assertiva; verificar nas fases 1 e 4.
2. **Sessão ativa ou ação bloqueada:** manter retomada e motivo, sem oferecer execução inválida; verificar nas fases 1 e 2.
3. **Tela estreita, texto longo e modo escuro:** sem corte, overflow ou perda de contraste; verificar em cada superfície afetada.
4. **Demo e primeiro acesso:** não misturar dados fictícios e reais; verificar na fase 5.
5. **Mudanças simultâneas e artefatos gerados:** revisar diffs antes de editar ou executar build e preservar trabalho existente em todas as fases.
