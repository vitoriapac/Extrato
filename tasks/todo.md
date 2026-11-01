# Tarefas: Onboarding e primeiro uso para iniciantes (ciclo 2)

Contexto e evidências: `tasks/plan.md`. Antes de ler código, rodar `graphify query "<pergunta>"` (regra do CLAUDE.md); depois de editar, rodar `graphify update .`.

Comandos de verificação usados abaixo:
- Unit: `npm run test:fast`
- E2E onboarding: `npx playwright test tests/e2e/onboarding.spec.js`
- Tipos: `npm run check:types && npm run check:types:tests`
- Bundle: `npm run build` (bundles são versionados; o E2E roda contra o bundle, então compile antes)
- Navegador limpo: abrir `http://127.0.0.1:4173` num contexto Playwright novo (sem armazenamento)

---

## Fase 1 — Fazer o primeiro uso que já existe funcionar

### T1: Estado inicial vazio e etapas concluídas só em ordem

**Descrição:** Remover a matéria de exemplo de `createDefaultState()` (`subjects: []`) e fazer `buildOnboardingViewModel` marcar uma etapa como concluída só quando ela e todas as anteriores estiverem completas. Com isso, quem chega pela primeira vez vê o card de boas-vindas, "0 de 4 etapas" e os pacotes de matérias.

**Critérios de aceite:**
- [x] Num navegador sem dados, a Visão Geral mostra o card de boas-vindas com "Montar meu plano de estudos" e "Experimentar demonstração", e nenhuma recomendação de matéria
- [x] O card de configuração mostra "Monte seu plano de estudos · 0 de 4 etapas", com Objetivo como etapa atual e nenhuma etapa marcada como concluída
- [x] A etapa de conteúdo do assistente mostra os 3 pacotes de matérias (coberto pelo E2E da T2)
- [x] Importar um backup antigo mantém as matérias do backup (conferido no código: `ensure-state-defaults.ts:43`; sem teste dedicado)

**Verificação:**
- [x] Unit + tipos + bundle verdes
- [x] Teste unitário novo em `tests/unit/` para a regra "etapa só conta como concluída em ordem" (data vazia + disponibilidade + conteúdo ⇒ 0 concluídas)
- [x] E2E que dependiam da matéria padrão ajustados e verdes
- [x] Conferência manual no navegador limpo

**Dependências:** nenhuma

**Arquivos prováveis:** `src/state/defaults.ts`, `src/application/onboarding/build-onboarding-view-model.ts`, `tests/unit/onboarding-view-model.test.js`, `tests/e2e/product-consolidation.spec.js`, `tests/e2e/achievement-projection.spec.js`, `tests/e2e/action-first-mobile.spec.js`

**Tamanho:** M

---

### T2: Teste E2E de primeiro acesso com armazenamento vazio

**Descrição:** Adicionar ao `tests/e2e/onboarding.spec.js` um caso que parte de armazenamento realmente vazio, sem seed, e garante os itens A–D do plano. Isso impede que um novo padrão volte a esconder o primeiro uso.

**Critérios de aceite:**
- [x] O teste verifica: card de boas-vindas visível, "0 de 4 etapas", pacotes visíveis na etapa de conteúdo
- [x] O teste falha se a matéria de exemplo voltar ao `createDefaultState()` (conferir revertendo T1 localmente)

**Verificação:**
- [x] E2E onboarding verde (20/20, só no fuso local; UTC/`America/Sao_Paulo` ficam para o gate do CI)

**Dependências:** T1

**Arquivos prováveis:** `tests/e2e/onboarding.spec.js`, `tests/config/test-inventory.json` / `docs/TEST-SUITE-INVENTORY.md` (se o inventário exigir registro)

**Tamanho:** S

---

### T3: Ligar o tour essencial de 3 paradas

**Descrição:** Em `guided-tour-controller.ts`, iniciar o tour com `ESSENTIAL_TOUR_STEPS`. Hoje `createGuidedTourState(0)` usa a lista antiga de 5 paradas, então o tour criado no ciclo anterior nunca roda.

**Critérios de aceite:**
- [x] "Fazer o tour" mostra "1 de 3 · Hoje", "2 de 3 · Visão Geral", "3 de 3 · Questões", e encerra com o aviso de conclusão
- [x] Cada parada destaca um elemento existente, com plano criado e sem plano; se o alvo não existir, a parada não fica sem destaque (com plano: E2E confere o destaque em `.plano-hoje-card`; sem plano: o controller já mostra o balão centralizado, sem destaque)
- [x] O foco volta ao elemento de origem ao fechar (código inalterado; E2E só confere o fechamento por Esc)

**Verificação:**
- [x] Coberto pelo E2E (`onboarding.spec.js`: 3 paradas, rótulos "1 de 3" a "3 de 3"); `ESSENTIAL_TOUR_STEPS` já tem unit em `guided-first-run.test.js`. `GUIDED_TOUR_STEPS` (5 paradas) ficou sem uso no app
- [x] E2E onboarding e demo verdes

**Dependências:** nenhuma

**Arquivos prováveis:** `src/ui/controllers/guided-tour-controller.ts`, `tests/unit/guided-first-run.test.js`

**Tamanho:** XS

---

### Checkpoint 1
- [ ] Unit, tipos, bundle e E2E onboarding verdes
- [ ] Navegador limpo: card de boas-vindas, "0 de 4", pacotes, tour "1 de 3"
- [ ] Corrigir em `docs/PLANOS-CONCLUIDOS.md` §9 o que só passou a funcionar agora
- [ ] Revisão humana antes da Fase 2

---

## Fase 2 — Menos atrito para iniciantes

### T4: Rodapé do assistente fixo e sempre visível

**Descrição:** Fixar no fim do modal (`position: sticky; bottom: 0`) o rodapé com Voltar/Continuar e o aviso de motivo do bloqueio. Hoje, em telas baixas, ele fica no limite da tela.

**Critérios de aceite:**
- [x] A 375×667 e a 1280×600, os botões ficam visíveis em todas as 4 etapas sem rolar
- [x] O rodapé não cobre o último campo da etapa (há espaço reservado ao fim do conteúdo)
- [x] Contraste e foco visível mantidos nos dois temas (cores e foco inalterados; o rodapé já usava `--wizard-bg`)

**Verificação:**
- [x] E2E onboarding + gate visual (`npm run test:visual`) verdes; nenhum snapshot mudou
- [x] Conferência a 375×667 e 1280×600: botão principal visível nas 4 etapas sem rolar

**Dependências:** nenhuma

**Arquivos prováveis:** `styles/app.css` (bloco do modal de onboarding)

**Tamanho:** XS

---

### T5: Etapa 1 com "Ainda não escolhi um concurso" e etapa 3 ligada à escolha

**Descrição:** Na etapa 1, deixar o seletor sem concurso pré-selecionado ("Selecione…") e adicionar a opção "Ainda não escolhi um concurso". Na etapa 3: se houver concurso do catálogo, o botão principal diz "Carregar edital: <nome do concurso>"; se for "ainda não escolhi", os pacotes de matérias aparecem primeiro e viram a ação principal.

**Critérios de aceite:**
- [ ] A etapa 1 não avança sem uma escolha no seletor; a mensagem de bloqueio diz o que falta
- [ ] Com um concurso do catálogo, a etapa 3 mostra "Carregar edital: <nome>" e abre a importação desse concurso
- [ ] Com "Ainda não escolhi", a etapa 3 mostra os pacotes em destaque e o edital do catálogo como opção secundária

**Verificação:**
- [ ] Unit para o renderer/view model (rótulo do botão por escolha) + E2E onboarding verde
- [ ] Conferência manual dos dois caminhos

**Dependências:** T1

**Arquivos prováveis:** `src/features/onboarding/onboarding-renderer.ts`, `src/application/onboarding/build-onboarding-view-model.ts`, `src/features/onboarding/onboarding-modal-controller.ts`, testes correspondentes

**Tamanho:** M

---

### Checkpoint 2
- [ ] Todos os gates verdes
- [ ] Fluxo completo no navegador limpo, do primeiro acesso ao plano criado, a 375×667
- [ ] Decidir se T6 entra

---

## Fase 3 — Opcional

### T6: Cabeçalho de métricas sem zeros no primeiro acesso

**Descrição:** Sem histórico nem plano, trocar a faixa "—/100 · 0 disciplinas · 0% · 0 dias" do cabeçalho por uma linha curta ("Seus números aparecem depois da primeira sessão"). Assim o iniciante não começa diante de um painel de zeros.

**Critérios de aceite:**
- [ ] No primeiro acesso, o cabeçalho mostra a linha curta; após a 1ª sessão ou o plano criado, volta ao normal
- [ ] O campo "Data da prova" continua acessível

**Verificação:**
- [ ] Unit + E2E + visual verdes

**Dependências:** T1

**Arquivos prováveis:** componente/renderer do cabeçalho em `src/ui/`, estilos

**Tamanho:** S
