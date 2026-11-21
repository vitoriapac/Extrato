# Investigação T10 — demo × produto (D2, D17, D-B)

Data: 20/11/2026. Método: estado da demo lido no navegador (`sessionStorage` `bb-premium-study-demo`), leitura do código e um teste de caracterização. Nenhuma correção feita ainda.

Classes: **dado da demo** · **defeito de cálculo** · **defeito de apresentação** · **correto, mal explicado**.

| # | Caso | Classe | Causa verificada | Correção proposta | Tarefa |
|---|---|---|---|---|---|
| 1 | "Classes de palavras" (85%) como foco da próxima semana / lacuna | **Defeito de cálculo** (e dado da demo que o expõe) | `buildWeeklyClose` monta `priorities` com as 3 primeiras recomendações **aceitas no período**, sem olhar o acerto atual do tópico (`src/domain/analytics/weekly-close.ts:97`). A demo (`learning-cycle.ts`) gera recomendações em tópicos escolhidos por posição, com acerto "antes" de 85%. Mesmo no produto real, um tópico que já melhorou continua "foco". | Filtrar `priorities` pelo acerto/domínio atual: tópico com amostra ≥ 10 questões e acerto ≥ meta sai do foco (D-D). Ajustar o gerador da demo para não recomendar tópico acima da meta. | T11 |
| 2 | "Iniciar revisão" em tópicos sem registro (Cartão de crédito, Capitalização) | **Correto, mal explicado**, com **dado da demo** | Os tópicos têm status "Revisão", 1 sessão, 0 questões, nenhuma revisão agendada. Não há sinal de acerto: cai no padrão de `topic-diagnosis-service.ts:~283` ("Fazer uma revisão de manutenção", `studyType: review`) porque o status não é "Em andamento" nem "Não iniciado". O rótulo segue o status marcado, não um defeito do botão. | Mostrar "Revisão de manutenção · sem questões registradas" em vez de "lacuna de cobertura 100/100"; na demo, dar às 2 disciplinas questões ou status coerente (T22). | T11/T22 |
| 3 | Analytics (diagnóstico) × Língua Portuguesa (plano) | **Correto, mal explicado** | Dois motores: o plano de hoje põe LP; o diagnóstico põe Analytics (Em andamento, 0 sessões, 0 questões, 1 recomendação, alto peso na prova). Já tratado por D-A com os nomes "Plano de hoje" × "Sugestão do diagnóstico" e pelos textos do T-anterior. | Só nomes e explicação (T12). | T12 |
| 4 | "Garantias bancárias" como #1 da fila do Diagnóstico | **Correto, mal explicado**, com **dado da demo** | Cartão: "Prioridade média · Revisão atrasada ou prevista para agora · Evidência: Baixa · Iniciar revisão". O tópico está "Concluído", 0 questões, 1 sessão, com revisão agendada para 16/11 (4 dias de atraso, status "Não iniciado"). A regra de ordenação põe revisão atrasada na frente. | Decidir (D-B) se revisão atrasada de tópico com evidência baixa deve ficar na frente de tópico crítico; mostrar o motivo no cartão. Na demo, revisão atrasada de tópico concluído sem registro é artefato do gerador. | T11 + decisão D-B |

## Decisão D-B (pendente, vem desta tabela)

Hoje a fila é ordenada primeiro por revisão atrasada. Proposta: **severidade primeiro, revisão atrasada como desempate**, exceto revisão com mais de 7 dias de atraso. Precisa da sua escolha antes do T11.

## Teste de caracterização

`tests/unit/weekly-close-priorities-stale.test.js` afirma o comportamento **atual** (tópico a 85% entra no foco). Quando o T11 corrigir, este teste deve passar a afirmar o contrário.

## O que não foi verificado

- Não confirmei a ordem exata da fila (peso de cada fator) para o caso 4; a regra "revisão atrasada na frente" vem da leitura do cartão, não do código de ordenação.
- A frase "lacuna de cobertura 100/100" do caso 2 não foi localizada no código; só o rótulo "Iniciar revisão".
- Rodei só a demo; não reproduzi com fixture pequena fora dela.
