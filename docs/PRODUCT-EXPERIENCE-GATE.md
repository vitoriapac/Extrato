# Gate de experiência do produto

Executar `npm run test:experience` depois de modificar a relação entre decisão, evidência e ação. É uma seleção dirigida dos contratos e jornadas existentes, com uma jornada adicional de primeiro uso. Não substitui Fast ou Full.

| Cenário | Contrato protegido | Cobertura |
|---|---|---|
| Iniciante | Sem projeção numérica fabricada; configuração acessível; sugestão introdutória opcional com evidência baixa | product-consolidation.spec.js e perfil beginner no Node |
| Com dados | Recomendações reutilizam os motores; evidências e análise por disciplina acessíveis | Demo em product-consolidation.spec.js; perfil intermediate |
| Sugestão fora do plano | Plano primário; sugestão dispensável; agenda preservada | daily-execution.spec.js e daily-execution.test.js |
| Baixa aderência | Metas e fechamento classificam os mesmos insumos da mesma semana; capacidade preservada | perfil irregular e weekly-adherence.test.js |
| Reta final | Risco e próxima ação explicáveis; prévia, confirmação, execução e fechamento preservam capacidade e histórico | perfil final_stretch e strategic-cycle.spec.js |

O [runner](../scripts/run-experience-gate.mjs) executa contratos Node em UTC/São Paulo e quatro jornadas browser em UTC, sem retries. Cada jornada tem seleção explícita por arquivo/título; uma seleção vazia falha. Artefatos por caso ficam separados em `.tmp-experience-gate`. O resumo local `.test-gates/experience-summary.json` registra commit, alterações locais, plataforma, tempos e resultados.

Comparações entre módulos exigem o mesmo período, escopo e denominador. Uma janela móvel e uma semana civil não são intercambiáveis. A ausência de evidência não impede sugestões introdutórias, mas não justifica uma intervenção obrigatória ou uma nota projetada.

## Fechamento da fase

Fast continua com um único smoke browser. O manifesto Full preserva suas matrizes; a jornada adicional pertence a um arquivo já classificado. Os testes Node de coerência participam dos gates existentes.

No encerramento desta fase, executar Full em Windows: ele já inclui as comparações visuais oficiais, acessibilidade automática e a jornada estratégica integrada. Não repetir a mesma matriz visual após um Full verde sem mudança nova. Inspecionar imagem e diff antes de atualizar uma referência.

Os resultados locais não confirmam o GitHub Actions. Axe e navegação por teclado não equivalem a uma avaliação manual com leitor de tela. Consulte [a política visual](VISUAL-TEST-POLICY.md), [a estratégia de testes](TEST-STRATEGY.md) e [a auditoria de jornadas](PRODUCT-JOURNEY-AUDIT.md).
