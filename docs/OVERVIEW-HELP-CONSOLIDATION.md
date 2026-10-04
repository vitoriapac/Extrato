# Consolidação da Visão Geral e Central de Ajuda

## Entregas

| Pacote | Resultado |
|---|---|
| 1 | Valores, progresso temporal, disciplina, tópico e metadata têm hierarquia própria; o grid diário foi preservado. |
| 2 | Detalhes adicionais são expansíveis; bloqueio por cronômetro ativo, orientação e alerta de plano antigo continuam visíveis. Pendências ficam no rodapé. |
| 3 | Configuração inicial mantém estados textuais, etapa atual com aria-current e CTA separado; a fase aparece em uma única superfície. |
| 4 | Ajuda ordena títulos, termos estruturados e conteúdo; limpeza restaura a ordem editorial. Calendário está em Planejar; sessões e pendências em Estudar. |
| 5 | Validação dirigida, documentação atualizada e smoke estreito incorporado à jornada existente. |

## Contratos preservados

- Nenhuma mudança nos cálculos de prioridade, Prontidão, planejamento ou persistência.
- Tempo creditado e atividades concluídas continuam distintos.
- Explicações estratégicas pertencem à atividade correspondente.
- Busca atua somente na documentação; exemplos são estáticos.
- Categorias preservam IDs e ações. Os sete grupos existentes foram mantidos.
- Histórico e capacidade não são alterados por apresentação ou navegação.

## Cobertura dirigida

Os arquivos Node relacionados cobrem renderers, view-model, busca, reconciliador e contrato de execução. A seleção browser reutiliza onboarding.spec.js, daily-execution.spec.js e visual-consolidation.spec.js: configuração até prévia, Escape/foco, sessão vinculada até reload, execução parcial e completa, bloqueio do cronômetro, detalhes acessíveis, busca e navegação.

A ajuda recebe smoke em 320 e 390 px e auditoria representativa em 375 claro e 1440 escuro. A execução tem referências Windows em 320 claro, 375 escuro e 430 claro; estados com nomes longos também passam por 390 e 1440 px. As referências existentes de mapa, matriz e glossário são comparadas sem atualização automática.

A política de validação permanece em [TEST-STRATEGY.md](TEST-STRATEGY.md), e a plataforma de comparação em [VISUAL-TEST-POLICY.md](VISUAL-TEST-POLICY.md). Este fechamento não amplia o manifesto Full. A suíte completa e a auditoria completa da Demo não são necessárias para estas mudanças de apresentação.

## Fechamento local — 4 de outubro de 2026

- Testes Node relacionados: 42 passaram (0,72 s).
- Fast: passou em 47,26 s, com unitários em UTC e São Paulo.
- Seleção browser dos três arquivos: 11 passaram (2,1 min), incluindo referências visuais Windows sem alterações.
- check:bundle: todos os quatro artefatos reproduzíveis.
- Full, matriz visual completa e auditoria completa da Demo não executados nesta rodada. O resultado local não confirma GitHub Actions.
