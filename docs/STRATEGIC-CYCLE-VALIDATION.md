# Validação do ciclo estratégico

## Pacote 5 — Evolução das prioridades

Perfis congelados nas recomendações apresentadas, nos itens do plano e nos fechamentos preservam prioridade, domínio, retenção, incidência, impacto, confiança, motivos e versão do motor. O fechamento guarda todos os candidatos do escopo, permitindo acompanhar tópicos que não apareceram entre as três recomendações. O agregador usa essas coleções existentes; registros antigos não recebem métricas calculadas hoje.

Cada tópico mostra uma observação por dia, filtro de disciplina e listas inicialmente limitadas a cinco itens. O diagnóstico atual é identificado como atual. Métodos diferentes ou evidência insuficiente impedem concluir melhora/piora; redução do impacto com domínio/ retenção estáveis aparece como estabilidade pessoal. Manutenção exige baixa prioridade, domínio adequado, retenção adequada e evidência suficiente. Não são feitos ajustes automáticos no planejamento.

## Pacote 4 — Fechamentos e comparação

Fechamentos alterados acrescentam versões na coleção existente; salvamentos de conteúdo idêntico não duplicam registros. Cada versão guarda revisão e referência anterior, métricas da comparação e a faixa de projeção disponível naquele momento. Registros legados são mantidos, sem reconstruir projeções passadas.

A comparação usa o último fechamento salvo do mesmo escopo, informa sobreposição de períodos e apresenta prontidão, precisão, cobertura ajustada no índice, aderência estratégica e faixa da projeção. Mudanças de método/pesos e campos ausentes não produzem deltas artificiais. Metadados de aplicação são congelados antes de persistir o snapshot, sem edição posterior do objeto salvo.

## Pacote 3 — Linha do Tempo Estratégica

O agregador `build-strategic-timeline` reúne prontidão, fechamentos, decisões de recomendações, planos, alterações/reversões por fase, redistribuições e simulados sem persistir uma segunda coleção. Filtros por categoria e o componente global limitam a apresentação inicial a cinco eventos. Datas de calendário permanecem dias; timestamps são convertidos pelo utilitário compartilhado de sessões.

Novos planos e feedbacks congelam o concurso ativo. Snapshots exigem o mesmo conjunto de concursos; registros legados de tópicos usam o vínculo atual com aviso. Planos legados sem escopo ficam fora de filtros específicos. Eventos futuros e feedbacks duplicados nas duas fontes de recomendações são excluídos.

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

## Pacotes 6 e 7

O acompanhamento vincula sessões à recomendação, preserva a linha de base e limita o crédito à duração recomendada. Melhora posterior não implica causalidade. A calibração preserva faixas realmente emitidas antes do resultado; nenhum histórico é reconstruído retroativamente. Backups anteriores migram para schema 26 com a coleção de faixas vazia.

## Pacote 8

O componente compartilhado apresenta Baixa, Moderada ou Alta, sem alterar os cálculos dos indicadores. Volumes e motivos são exibidos em detalhes nativos acessíveis. Evidências não avaliadas ficam explicitamente identificadas; tendência comparável não é convertida em confiança estatística.

### Validação dos pacotes 6–8

431 testes unitários em UTC e America/Sao_Paulo. Verificações de sintaxe e artefatos gerados. E2E selecionados: migrações de backups 23/24, ciclo estratégico, histórico, calibração preservada e abertura dos detalhes por teclado. A calibração foi verificada de 320 a 430 px nos temas claro/escuro. Esta rodada não executa a suíte E2E completa.

## Pacote 9 — Metas de acerto por disciplina

`examBlueprint.subjects[].accuracyTarget` é opcional e herda `metas.metaAprovacao`. Não substitui a meta de domínio nem altera incidência ou peso oficial. Questões, simulados detalhados, diagnóstico, lacunas, evolução das prioridades e fechamento mostram a referência adequada. Fechamentos preservam as metas da captura. O schema 26 permanece compatível: backups anteriores omitem o campo e herdam a meta geral.
