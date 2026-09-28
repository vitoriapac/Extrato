# Validação do ciclo estratégico

## Pacote 1 — Estratégia por fase

- Limites: construção acima de 90 dias, consolidação de 31 a 90, reta final de 8 a 30 e revisão final de 0 a 7; data passada, ausente ou não finita impede proposta.
- Cobertura abaixo de 50% preserva teoria; lacuna de alto impacto e domínio abaixo de 50 preserva trabalho de base mesmo em conteúdo marcado coberto. Domínio adequado e cobertura consolidada recebem manutenção; retenção abaixo de 60 amplia revisão.
- Evidência em pelo menos dois tópicos distintos do próprio plano. Tópicos com pouca evidência conservam a divisão anterior. Mix inválido e orçamento inconsistente bloqueiam a proposta.
- Soma por tópico e orçamento semanal permanecem exatos, inclusive minutos ímpares. Cooldown de 14 dias utiliza datas locais e vale após aplicação e reversão.
- Confirmação/reversão ficam no controlador de aplicação, com revalidação de base, capacidade, fase e evidências. Criam versões; sessões, planos diários e snapshots anteriores permanecem preservados.
- Cobertura: tests/unit/phase-strategy.test.js; regressões de navegação/distribuição em tests/e2e/planning.spec.js.

## Pacote 2 — Ciclo completo

- Fixture determinística com quatro disciplinas, vinte tópicos, oito semanas, 160 sessões, questões pessoais, revisões, quatro simulados comparáveis e provas históricas BB/Caixa. Inclui tópicos críticos, consolidados e compartilhados.
- O navegador percorre matriz, prioridade, confirmação do plano semanal, estratégia por fase, distribuição diária, execução de recomendação, sessão, medição posterior, fechamento e planejamento da próxima semana.
- Observações posteriores de questões e simulado são inseridas pela fixture; a sessão que dispara a avaliação e as decisões seguintes usam os fluxos reais da aplicação. O teste não simula a digitação desses dois registros.
- Cenário mobile cobre reversão, cooldown, troca de concurso, evidência insuficiente e validação do backup serializado. Compara os registros históricos para impedir alterações retroativas ou duplicação de tópicos compartilhados.
- Cobertura: tests/fixtures/strategic-cycle.js, tests/unit/strategic-cycle-fixture.test.js e tests/e2e/strategic-cycle.spec.js.
- Correção encontrada pelo ciclo: o fechamento lê a duração congelada em `snapshot.recommendedMinutes` quando o feedback não possui `estimatedMinutes`. Isso permite aplicar a recomendação ao próximo plano sem perder sua carga. Valores explícitos legados, inclusive zero, continuam preservados.
