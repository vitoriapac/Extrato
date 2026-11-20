# Validação da inteligência da prova e do planejamento V4

A massa determinística em `tests/fixtures/exam-intelligence-stress.js` combina 130 dias de progresso pessoal, 170 sessões e 16 provas históricas: seis BB, seis Caixa TBN e quatro Caixa TI. Há anos e pesos distintos, três provas parciais com questões pendentes e classificações de baixa confiança. Os testes isolam questões históricas das questões respondidas pelo estudante.

## Decisões observadas

| Cenário | Decisão esperada | Resultado observado | Avaliação |
| --- | --- | --- | --- |
| Alto impacto, domínio 42 | Priorizar a lacuna | Prioridade 48; planejamento propõe transferência com origem elegível | Correto |
| Alto impacto, domínio 91 | Manutenção | Prioridade 35; a V4 protege a disciplina quando seu impacto supera o destino | Correto |
| Baixo impacto, domínio 42 | Abaixo da lacuna de alto impacto | Prioridade 37, abaixo de 48 | Correto |
| Uma prova histórica | Usar a configuração anterior | Impacto 55, sem ajuste histórico | Correto |
| Histórico divergente do ajuste manual | Sinalizar sem sobrescrever | Auditoria divergente; impacto manual 25 preservado | Correto |

A troca BB ↔ Caixa recalcula denominadores e impactos; o tópico compartilhado aparece uma vez no escopo conjunto. O planejamento preserva 180 minutos semanais e bloqueia nova transferência do mesmo par durante o cooldown. Esses cenários não apontaram necessidade de recalibrar os limites da V4.

## Contratos versionados

- **Exam Intelligence V1** calcula incidência e ajuste histórico. Configuração em `src/domain/exam-intelligence/config.js`.
- **Priority Engine V5** combina impacto com necessidade pessoal. Versão em `src/domain/analytics/priority-score.js`.
- **Adaptive Planning V4** decide propostas de transferência. Versão em `src/domain/planning/adaptive-planning.js`.

O histórico de recomendações novas grava as versões da prioridade e da inteligência da prova; o snapshot do feedback grava as duas também. Registros anteriores preservam a versão que possuíam, sem atribuir retroativamente uma versão de inteligência da prova. O histórico de ajustes de planejamento já grava a versão V4.
