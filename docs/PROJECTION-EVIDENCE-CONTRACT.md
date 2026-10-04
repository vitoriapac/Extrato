# Contrato das evidências da projeção

A projeção existente combina src/domain/forecasts e src/application/projection. A faixa descreve desempenho em simulados comparáveis, não nota prevista no dia da prova nem probabilidade de aprovação.

## Fontes e limites atuais

- Simulados válidos nos últimos 90 dias, sem datas futuras; registros duplicados por ID são ignorados.
- A composição do último simulado válido define o grupo: tags e distribuição de questões por disciplina. Uma nova composição pode tornar a evidência insuficiente.
- No máximo 12 observações, uma por data. Disponibilidade exige três datas, 120 questões e amplitude de 14 dias.
- Centro: mediana dos três últimos resultados. Faixa conservadora: dispersão e erros retrospectivos; não é intervalo estatístico de confiança.
- Confiança moderada exige composição conhecida, seis datas, três resíduos retrospectivos e 28 dias. O aplicativo exige também tendência disponível para apresentar confiança moderada. Confiança alta não é oferecida.
- Questões pessoais, cobertura, retenção e volume de estudo não viram pontos artificiais. Cobertura e execução contextualizam riscos.

## Auditoria determinística

As fixtures em tests/fixtures/projection-scenarios/evidence-audit.js cobrem ausência de dados, questões sem simulados, volume e amplitude insuficientes, composição desconhecida ou alterada e outlier. Os testes também verificam exclusões, limites da faixa, determinismo e imutabilidade.

Históricos congelados, filtros de concurso, comparação por meta/data e versões do algoritmo continuam protegidos pelos testes existentes. Este ciclo não recalcula snapshots nem muda critérios de classificação.

## Explicabilidade

Os requisitos de disponibilidade são centralizados em projection-evidence-policy.js e compartilhados pelo cálculo e pelo onboarding da projeção. A interface apresenta uma explicação adicional, inicialmente fechada, com contagem de simulados, questões, amplitude temporal, exclusões do grupo válido e limites da faixa. Exclusões não representam todos os registros inválidos: o contador existente considera registros válidos fora do conjunto utilizado.

Composição desconhecida e ausência de calibração retrospectiva têm motivos explícitos. Esses motivos não alteram o nível da confiança, o algoritmo da nota, o status nem a versão dos snapshots. Históricos já capturados não são reescritos.

## Validação dos pacotes 1 e 2

Em 4 de outubro de 2026: 50 testes Node relacionados passaram; Fast passou em 45,67 s; quatro jornadas com Demo e referências Windows passaram em 60,0 s (320 claro, 375 escuro, 430 claro e 1440 escuro). As imagens reais e diffs foram inspecionados antes de atualizar as referências. Os artefatos gerados são reproduzíveis. Full não foi executado: não houve migração, alteração de persistência ou mudança de semântica dos snapshots. O resultado local não confirma GitHub Actions.
