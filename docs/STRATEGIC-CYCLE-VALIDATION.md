# Validação do ciclo estratégico

## Pacote 1 — Estratégia por fase

- Limites: construção acima de 90 dias, consolidação de 31 a 90, reta final de 8 a 30 e revisão final de 0 a 7; data passada, ausente ou não finita impede proposta.
- Cobertura abaixo de 50% preserva teoria; lacuna de alto impacto e domínio abaixo de 50 preserva trabalho de base mesmo em conteúdo marcado coberto. Domínio adequado e cobertura consolidada recebem manutenção; retenção abaixo de 60 amplia revisão.
- Evidência em pelo menos dois tópicos distintos do próprio plano. Tópicos com pouca evidência conservam a divisão anterior. Mix inválido e orçamento inconsistente bloqueiam a proposta.
- Soma por tópico e orçamento semanal permanecem exatos, inclusive minutos ímpares. Cooldown de 14 dias utiliza datas locais e vale após aplicação e reversão.
- Confirmação/reversão ficam no controlador de aplicação, com revalidação de base, capacidade, fase e evidências. Criam versões; sessões, planos diários e snapshots anteriores permanecem preservados.
- Cobertura: tests/unit/phase-strategy.test.js; regressões de navegação/distribuição em tests/e2e/planning.spec.js.
