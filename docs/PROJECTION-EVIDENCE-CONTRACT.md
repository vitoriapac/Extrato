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
