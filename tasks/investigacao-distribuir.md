# Investigação: por que "Distribuir nos próximos 7 dias" propõe só 2h20 de um plano de 12h

Tarefa 2 de [todo-planejamento.md](todo-planejamento.md). Data: 14/11/2026. Reprodução com os dados da demonstração, chamando `buildDailyPlanProposal` com as mesmas entradas que `calculateDailyPlanPreview` monta (`study-plan-builder-controller.ts`).

## Resultado

O cálculo não tem defeito: os 2h20 e os "12h10 sem espaço" saem de regras corretas aplicadas a dados que se contradizem. A reprodução bate com a tela, minuto a minuto (140 min distribuídos, 730 min sem espaço, 5 dias com proposta).

| O que a tela mostra | Reproduzido |
|---|---|
| Tempo a distribuir 14h30 | 870 min = plano de 720 + 6 revisões da agenda × 25 |
| Distribuição proposta 2h20 | 140 min, em 16 a 20/11, 28 min por dia |
| Sem espaço nos 7 dias 12h10 | 730 min |
| "28min planejados · 12min livres" por dia | 120 disponíveis − 12 de reserva − 80 já agendados = 28; os 12 livres são só a reserva |

## Causas

### 1. A agenda já marcada ocupa a capacidade (explica a maior parte)

A demo cria 8 planos diários, de hoje a hoje+7, com 80 min cada (45 de estudo e 35 de questões), **sem vínculo com o plano semanal confirmado** (`studyPlanId` e `studyPlanItemId` ausentes; `src/demo/demo-builders/planning.ts`, laço `index < 8`). A distribuição desconta o que já está agendado em cada dia (`slot.existing`, `distribute-study-plan.ts`). Nos 7 dias da janela isso soma 560 min de uma disponibilidade de 720; hoje (sábado, 60 min) e domingo (60 min) ficam sem espaço algum, e de segunda a sexta sobram 28 min.

- **Classificação:** regra de negócio correta (não sobrepor o que o estudante já agendou) **mais dado da demo** que torna o efeito extremo.
- **Sem a agenda futura existente**, a mesma entrada distribui 645 min em 7 dias (em vez de 140).

### 2. O plano de 12h usa 100% da capacidade, e a distribuição reserva 10% e soma revisões por cima

Mesmo com a agenda vazia, 225 min (3h45) não cabem. O plano confirmado tem 720 min (`weeklyPlannedMinutes` = `weeklyAvailableMinutes` = 720) e já inclui 65 min de revisões (9%). A distribuição então:

- reserva 10% da disponibilidade (72 min), deixando 648;
- soma as 6 revisões pendentes da agenda (150 min) como itens a distribuir, além das revisões do plano.

Resultado: 870 min para 648 min de espaço. O plano foi construído para ocupar a capacidade inteira, e a etapa seguinte nunca consegue honrar isso.

- **Classificação:** inconsistência de desenho entre duas regras, não um defeito de código. Qualquer usuário com plano confirmado e revisões pendentes vê "sem espaço", com ou sem agenda marcada.

## O que foi feito na Tarefa 2

Não alterei o cálculo: mudar a reserva ou a soma de revisões muda o que o app promete ao estudante e é decisão de produto (abaixo). Corrigi o que era defeito de comunicação: a prévia dizia o quanto não coube, mas não por quê, e não oferecia saída.

- A proposta devolve os totais da janela (`window.availableMinutes`, `reserveMinutes`, `existingMinutes`).
- A prévia mostra, quando algo não cabe: "Cabem 2h20 dos 14h30. A disponibilidade dos 7 dias soma 12h; 9h20 já estão agendados e 1h12 ficam de reserva."
- O botão "Ajustar disponibilidade" abre a dobra de metas e leva ao bloco de disponibilidade semanal.
- Testes: `daily-plan-distribution.test.js` (agenda e reserva consomem a capacidade e os totais saem certos) e `study-plan-builder-controller.test.js` (explicação aparece só quando algo não cabe; a ação abre a dobra).

## Decisões que são suas

1. **Reserva de 10% e plano de 100% da capacidade.** Opções:
   - (a) O plano semanal passa a ocupar 90% da capacidade, deixando a reserva já na proposta (muda o cálculo do plano e os números "12h por semana").
   - (b) A distribuição deixa de reservar 10% quando o plano já é a capacidade inteira.
   - (c) Manter e só explicar (o estado atual).
   Recomendo (a): o plano prometeria o que a distribuição consegue cumprir. É mudança de regra com impacto em planos já confirmados; precisa de prévia e de teste de migração, então fica fora da Tarefa 2.
2. **Revisões da agenda somadas às revisões do plano.** O plano já reserva 9% para revisões e a agenda traz 150 min de revisões reais. Opções: somar (hoje), ou deixar as revisões da agenda substituírem a reserva do plano (o plano de revisões vira o que está de fato vencendo). Recomendo substituir, pelo mesmo motivo.
3. **A demo.** Os 80 min por dia sem vínculo fazem o "Distribuir" da demonstração parecer quebrado para quem a vê pela primeira vez. Opções: vincular esses itens ao plano semanal, ou reduzi-los a um dia útil por semana. Recomendo vincular, mas a mudança mexe em "Com tarefa marcada 2h40", aderência e referências visuais; é melhor junto com a Tarefa 4 (números coerentes), quando esses valores serão revistos de qualquer forma.
