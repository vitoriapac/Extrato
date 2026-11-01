# Plano: Onboarding e primeiro uso para iniciantes (ciclo 2)

## Visão geral

O ciclo anterior (docs/PLANOS-CONCLUIDOS.md §9) criou o card de boas-vindas, os pacotes de matérias em 1 clique, o calibrador de rotina, o aquecimento de 15 min e o tour de 3 paradas. Abri o app num navegador **sem nenhum dado** (origem `http://localhost:4173`) e vi que boa parte disso **não chega ao usuário novo**:

| # | O que acontece hoje no primeiro acesso | Causa (verificada no código) |
|---|---|---|
| A | A tela inicial já recomenda "Português · Interpretação de Texto · prioridade 21/100", uma matéria que o usuário nunca escolheu | `createDefaultState()` cria essa matéria de exemplo (com link `https://youtube.com`) — `src/state/defaults.ts:10-39` |
| B | O **card de boas-vindas nunca aparece** | Ele só é exibido quando não há recomendação (`study-recommendation-controller.ts:296-312`); a matéria de exemplo sempre gera uma |
| C | O card de configuração diz **"Continue sua configuração · 2 de 4 etapas"** com Disponibilidade e Edital marcados como concluídos, sem o usuário ter feito nada | Etapas contam como concluídas pelos valores padrão (2,5h/dia + matéria de exemplo) — `build-onboarding-view-model.ts:163-168` |
| D | Os **pacotes de matérias em 1 clique não aparecem** na etapa de conteúdo | Eles só aparecem quando não há matérias (`onboarding-renderer.ts:155`) |
| E | O **tour de 3 paradas nunca roda**; roda o antigo, de 5 | `guided-tour-controller.ts:147` chama `createGuidedTourState(0)` sem passar `ESSENTIAL_TOUR_STEPS` |
| F | No assistente, os botões Voltar/Continuar ficam no limite inferior da tela (topo em 761px num viewport de 768px), e o rodapé não fica fixo | Rodapé `position: static` |
| G | A etapa 1 já vem com "Banco do Brasil — Escriturário" selecionado; não há opção para quem ainda não escolheu um concurso | Primeiro preset selecionado por padrão |

Os itens A–E são defeitos: o comportamento prometido já existe, mas não chega a quem usa o app pela primeira vez. Por isso vêm primeiro. F e G são melhorias novas.

## Decisões de arquitetura

- **Estado inicial vazio** (`subjects: []`). É a correção de raiz de A, B e D: o card de boas-vindas e os pacotes já tratam "sem matérias". Não precisa de código novo de UI.
- **As etapas só contam como concluídas em ordem**: uma etapa só aparece como concluída se as anteriores também estiverem. É uma linha no view model e corrige C sem um campo novo de "confirmado".
- **Não mexer nos dados de quem já usa o app.** Usuários antigos que ainda têm a matéria de exemplo intacta continuam com ela (ver Perguntas em aberto). Confirmado: estado carregado nunca recebe as matérias do padrão (`ensure-state-defaults.ts:43` usa `[]`); `createDefaultState()` só é usado no primeiro acesso, no reset e na demo.
- Os bundles (`src/app.bundle.js`) são versionados: toda tarefa termina com `npm run build`.

## Grafo de dependências

```
T1 estado inicial vazio + etapas em ordem
   ├── T2 teste E2E "primeiro acesso real" (trava A–D)
   └── T5 conteúdo usa o concurso escolhido / "ainda não sei"
T3 tour de 3 paradas ligado  (independente)
T4 rodapé fixo do assistente (independente, só CSS)
T6 cabeçalho sem zeros no primeiro acesso (depende de T1; opcional)
```

## Lista de tarefas

### Fase 1 — Fazer o primeiro uso que já existe funcionar
- [x] T1: Estado inicial vazio e etapas concluídas só em ordem
- [x] T2: Teste E2E de primeiro acesso com armazenamento vazio
- [ ] T3: Ligar o tour essencial de 3 paradas

### Checkpoint 1
- [ ] `npm run test:fast` verde; `npx playwright test tests/e2e/onboarding.spec.js` verde
- [ ] Num navegador limpo: card de boas-vindas visível, "0 de 4 etapas", pacotes visíveis, tour com "1 de 3"
- [ ] Revisão humana antes da Fase 2

### Fase 2 — Menos atrito para iniciantes
- [ ] T4: Rodapé do assistente fixo e sempre visível
- [ ] T5: Etapa 1 com "Ainda não escolhi um concurso" e etapa 3 ligada à escolha

### Checkpoint 2
- [ ] Gates verdes; fluxo completo do assistente a 375×667 sem rolar para achar os botões

### Fase 3 — Opcional (decidir no checkpoint 2)
- [ ] T6: Cabeçalho de métricas sem zeros no primeiro acesso

## Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Testes E2E assumem a matéria "Português" padrão (`state.subjects[0].id`) | Alto | Confirmado em 4 testes: `product-consolidation.spec.js:214`, `achievement-projection.spec.js:299` e `:341`, `action-first-mobile.spec.js:4`. Ajustar para criarem a própria matéria, sem reintroduzi-la no padrão |
| Testes visuais (snapshots) mudam porque a tela inicial muda | Médio | Atualizar snapshots só das telas de primeiro acesso, conferindo o diff à mão |
| Tour de 3 paradas aponta para `.plano-hoje-card`, que pode não existir antes do plano | Médio | T3 verifica o tour com e sem plano; parada sem alvo deve ser pulada ou ter alvo alternativo |

## Perguntas em aberto

1. **Usuários antigos com a matéria de exemplo intacta** (Português/Interpretação de Texto, link youtube.com, nenhuma sessão): limpar automaticamente ou deixar como está? A recomendação é deixar como está: apagar dados do usuário é irreversível e o ganho é pequeno.
2. **T6 vale a pena?** Ele mexe no cabeçalho, que aparece em todas as telas, e em testes visuais. Só faz sentido se, depois da Fase 1, o cabeçalho com "—/100, 0, 0%" ainda parecer intimidador ao lado do card de boas-vindas.
3. Na etapa 1, a opção "Ainda não escolhi" deve levar direto aos pacotes (Administrativa, Policial, Fiscal) ou também perguntar a área?
