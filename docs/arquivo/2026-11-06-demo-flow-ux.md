# Plano de Implementação — Jornada do Modo Demonstração

> **Para quem implementar:** execute as tarefas na ordem e marque cada etapa. Este plano cobre a experiência integrada da Demo; não requer delegação.

**Objetivo:** Fazer a entrada, o tour, o modo foco e a saída da demonstração manterem contexto claro, sem alterar dados reais.

**Arquitetura:** Manter entrada e saída em `createDemoController`, o posicionamento e conteúdo do tour nos módulos atuais de onboarding, e o rótulo do modo foco na UI existente do cronômetro. A navegação deve voltar à Visão geral e ao topo ao entrar ou sair. O estado fictício continua isolado na sessão; a lógica de estudo e persistência real não muda.

**Stack:** TypeScript/JavaScript existente, Preact 11 onde já usado, CSS/Tailwind com tokens, Playwright E2E e testes Node.

**Especificação:** Auditoria manual do fluxo Demo feita em 2026-11-06 e critérios abaixo; sem documento separado.

## Restrições globais

- Não adicionar funções em `src/app.ts`; manter a raiz de composição sem regras de UI.
- Componentes novos seguem Preact 11 e primitivas existentes; estilos usam tokens de `styles/tokens.css`, sem cores soltas.
- Interações precisam de nome acessível e suporte a teclado; usar ícones Tabler e nenhum emoji.
- A Demo permanece isolada em `sessionStorage`; sair remove a sessão fictícia e preserva exatamente o estado real em `localStorage`.
- `index.html` é entrada do build: editar a marcação-fonte e reconstruir os artefatos; não editar HTML versionado, bundles ou service worker gerados manualmente.
- Antes de alterar `styles/app.css`, inspecionar e preservar o diff local existente nesse arquivo.
- Antes de `npm run build`, inspecionar os diffs locais já existentes em `src/app.bundle.js`, `service-worker.js` e outros artefatos que o build possa regenerar; preservar ou reconciliar essas alterações.
- Estender arquivos de teste já classificados; não criar arquivo de teste sem atualizar `tests/config/test-tiers.json` e executar `node scripts/check-test-tiers.mjs`.

## Critérios de aceite

1. Carregar a Demo pelo CTA do rodapé, com rolagem anterior no fim da página, abre em Visão geral no topo; o selo de dados fictícios fica visível sem rolagem.
2. No tour essencial, a etapa Hoje destaca uma área pequena e útil, não cobre o botão `Iniciar` e não instrui clicar em uma ação bloqueada pelo próprio overlay. Os controles Próximo, Anterior, Fechar e Escape continuam funcionais.
3. No modo foco, a sessão da Demo mantém um rótulo visível de dados fictícios. No modo real, esse rótulo permanece oculto.
4. Sair da Demo de qualquer aba volta à Visão geral no topo, remove `bb-premium-study-demo` e restaura sem alteração o estado real persistido.
5. A entrada, o foco e a saída continuam sem overflow em largura de 320 px e em desktop; o caminho de cancelar a prévia continua sem efeitos colaterais.

## Foco de revisão

- CTA de rodapé com scroll alto e hash prévio: a Demo deve terminar no topo da Visão geral.
- Prévia cancelada em 320 px: nenhum modo é ativado e o estado real permanece igual.
- Etapa Hoje do tour em viewport baixo e card longo: o popover não cobre `Iniciar` e não afirma que uma ação bloqueada pode ser clicada.
- Modo foco em Demo e em estado real: o aviso fictício aparece somente na Demo, sem ocultar os controles do timer.
- Saída enquanto Hoje ou outra aba está ativa: rota limpa, scroll no topo, sessão fictícia removida e armazenamento real idêntico ao anterior.

---

### Tarefa 1: Normalizar a navegação ao entrar na Demo

**Arquivos:**
- Modificar: `src/ui/controllers/demo-controller.ts`
- Modificar: `src/bootstrap/wire-storage-and-sync.ts` somente se o callback atual de reload precisar receber a rota inicial
- Testar: `tests/unit/demo-controller.test.js`
- Testar: `tests/e2e/demo.spec.js`

**Interface:** A ativação existente da Demo deve solicitar a rota inicial `dashboard` e o topo após o reload. Evite criar outro serviço de navegação; use o callback de reload/composição já injetado.

- [x] Acrescentar em `tests/e2e/demo.spec.js` o caso `entrada pelo CTA do rodapé abre a Demo no topo da Visão geral`: chegar à página, rolar até o rodapé, carregar a Demo e verificar `#panel-dashboard` visível, `window.scrollY <= 1` e `#demoHeaderBadge` dentro do viewport.
- [x] Acrescentar ao teste unitário do controlador a expectativa de que `enterMode` precede o reload e a solicitação de início em `dashboard` é encaminhada.
- [x] Executar primeiro os novos casos e confirmar que falham com a posição/hash atuais.
- [x] Implementar a normalização no fluxo já existente de `load()` e no callback de reload em `wire-storage-and-sync.ts`, sem tocar em `src/app.ts`.
- [x] Executar os casos unitário e E2E e confirmar que passam; manter a prévia cancelada sem ativar o modo.

### Tarefa 2: Evitar que o tour obstrua a ação destacada

**Arquivos:**
- Modificar: `src/domain/onboarding/guided-tour-steps.ts`
- Modificar: `src/ui/controllers/guided-tour-controller.ts` se o posicionamento ainda sobrepuser a ação no viewport
- Testar: `tests/e2e/demo.spec.js`

**Interface:** Preserve o contrato atual de passos e o popover. Reduza o alvo da etapa Hoje para o cabeçalho/introdução do plano, em vez do card inteiro; o texto deve descrever a área e deixar claro que o usuário pode experimentar `Iniciar` depois de fechar o tour.

- [x] Ajustar os passos `today-execution` de `GUIDED_TOUR_STEPS` e `ESSENTIAL_TOUR_STEPS` para o alvo menor e a mensagem coerente.
- [x] Acrescentar o caso `tour da Demo destaca Hoje sem cobrir a ação Iniciar` em `tests/e2e/demo.spec.js`; verificar a interseção entre a caixa do popover e o primeiro botão `Iniciar` em 1280×720 e 1280×900, além de avançar, voltar, fechar e fechar por Escape.
- [x] Confirmar que o caso falha no passo atual em pelo menos um viewport por sobreposição ou instrução conflitante.
- [x] Ajustar o seletor e a mensagem da etapa; só mudar `calculatePosition()` se o teste ainda mostrar sobreposição. Não permitir que a tela escurecida seja a única indicação de como prosseguir.
- [x] Executar o caso E2E e verificar foco inicial, retorno de foco, controles acessíveis e ausência de overflow.

### Tarefa 3: Manter a identificação fictícia no modo foco

**Arquivos:**
- Modificar: `index.html` na marcação-fonte de `#timerFocusContext`
- Modificar: `src/ui/controllers/demo-controller.ts` para sincronizar a visibilidade do novo rótulo
- Modificar: `styles/app.css` apenas se a marcação existente não der contraste e espaçamento adequados
- Testar: `tests/e2e/demo.spec.js` e `tests/e2e/daily-execution.spec.js`

**Interface:** Adicione um rótulo estático e acessível, oculto por padrão, dentro de `#timerFocusContext`; `demoController.sync()` deve exibi-lo apenas quando `isDemo` for verdadeiro. Reutilize tokens e tipografia existentes.

- [x] Em `tests/e2e/demo.spec.js`, acrescentar o caso `modo foco identifica dados fictícios na Demo` e verificar o rótulo visível com cronômetro/saída utilizáveis.
- [x] Em `tests/e2e/daily-execution.spec.js`, estender o caso real de entrada em modo foco e verificar que o rótulo fictício fica oculto.
- [x] Confirmar que o caso falha no foco da Demo antes da implementação e passa depois.
- [x] Preservar o comportamento do cronômetro, o modo foco atual e seus testes existentes.
- [x] Verificar visualmente o rótulo em 320 px e 1280 px, nos temas claro e escuro, sem overflow.

### Tarefa 4: Retornar à Visão geral ao sair e provar preservação dos dados

**Arquivos:**
- Modificar: `src/ui/controllers/demo-controller.ts`
- Modificar: `src/bootstrap/wire-storage-and-sync.ts` se necessário para a rota inicial de reload
- Testar: `tests/unit/demo-controller.test.js`
- Testar: `tests/e2e/demo.spec.js` — estender `isola, reinicia e encerra a demonstração sem alterar o estado real`

**Interface:** A saída usa o mesmo destino `dashboard` e topo definidos na Tarefa 1. Manter a mensagem de encerramento e o mecanismo atual de restauração.

- [x] Estender o caso E2E existente para sair enquanto `#panel-hoje` está ativa e com scroll; verificar Visão geral no topo, banner oculto, `sessionStorage.getItem('bb-premium-study-demo') === null`, modo `real` e igualdade profunda do estado persistido real antes/depois.
- [x] Acrescentar expectativa unitária de que a saída limpa o modo e solicita a rota `dashboard` antes do reload.
- [x] Executar o caso antes da implementação e confirmar que falha na rota/scroll, mantendo as verificações existentes de preservação de dados.
- [x] Implementar a navegação de saída no controlador/callback de reload sem recriar estado persistente nem alterar o conteúdo do backup.
- [x] Executar os casos E2E e unitário e confirmar a restauração exata do estado real.

### Verificação final

- [x] Executar `npm run test:fast` e os testes unitários alterados.
- [x] Executar a suíte E2E densa da Demo; os 11 cenários passaram.
- [x] Calcular e revisar a seleção de impacto com `npm run test:affected -- --dry-run`; ela indicou Full devido às alterações locais preexistentes. O gate Full não foi executado; foram executados os gates proporcionais e a suíte densa da Demo.
- [x] Executar `npm run check:types` via `test:fast` e `npm run build`; não editar artefatos gerados manualmente.
- [x] Informar comandos, resultados, tempos quando disponíveis, e qualquer gate não executado.

## Fora deste escopo

O erro de console de CSP visto na auditoria não foi ligado a uma interação específica da Demo. Investigar sua origem separadamente antes de incluí-lo nesta implementação.
