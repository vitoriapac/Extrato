# Arquitetura

O aplicativo continua executando inteiramente no navegador e sem dependências externas de JavaScript.

## Estrutura

- `index.html`: marcação e pontos de montagem da interface.
- `styles/tokens.css`: cores, temas e tokens visuais.
- `styles/app.css`: layout e componentes.
- `src/theme-bootstrap.js`: aplica o tema antes da primeira pintura.
- `src/bootstrap/bootstrap-application.js`: executa a inicialização com contexto explícito e contenção de falhas.
- `src/bootstrap/register-lifecycle.js`: registra e permite desmontar eventos globais do ciclo de vida.
- `src/bootstrap.js`: reexportação temporária compatível do bootstrap modular.
- `src/application/create-app-context.js`: registra provider, relógio, repositórios e gerador de IDs injetáveis.
- `src/application/demo/demo-mode.js`: controla entrada, reinício e saída segura da demonstração.
- `src/state/schema.js`: contrato do estado, versões, enums e chaves de armazenamento.
- `src/state/defaults.js`: fábrica do estado inicial, sem compartilhar referências mutáveis.
- `src/state/strategic.js`: normalização do plano de prova, importância/esforço dos tópicos e versões dos algoritmos.
- `src/core/utils.js`: utilidades puras e validações primitivas.
- `src/core/clock.js`: relógio injetável para datas locais e instantes reproduzíveis.
- `src/storage/repository.js`: acesso a IndexedDB, `localStorage` e `window.storage`.
- `src/storage/storage-provider.js`: contrato dos providers, incluindo carga, gravação, remoção, exportação e importação.
- `src/storage/indexed-db-provider.js`: acesso isolado ao IndexedDB.
- `src/storage/local-storage-provider.js`: fallback contido para armazenamento local.
- `src/storage/real-storage-provider.js`: adaptação compatível da persistência real existente.
- `src/storage/demo-storage-provider.js`: persistência temporária e isolada em `sessionStorage`.
- `src/storage/migration-service.js`: execução ordenada e verificável das migrações de schema.
- `src/storage/backup-service.js`: serialização, leitura segura e nomes dos arquivos de backup.
- `src/repositories/collection-repository.js`: contrato uniforme de consulta e mutação das coleções do estado.
- `src/demo/demo-generator.js`: cenário determinístico móvel de 90 dias para exploração do produto.
- `src/domain/reviews.js`: regras puras de intervalos e revisões adaptativas.
- `src/domain/analytics/evidence.js`: contrato comum de amostra, período, confiança e fontes.
- `src/domain/analytics/score-evidence.js`: separa disponibilidade de dados, força da evidência e incerteza heurística.
- `src/domain/analytics/priority-score.js`: fórmula única de prioridade usada por recomendações e planejamento.
- `src/domain/analytics/topic-metrics.js`: métricas puras de domínio e retenção por tópico.
- `src/domain/analytics/review-health.js`: condição explicável da revisão a partir de recência, retenção, domínio, desempenho e impacto da prova.
- `src/domain/analytics/readiness-score.js`: composição ponderada do índice e de sua confiança.
- `src/domain/analytics/coverage.js`: cobertura de tópicos ativos.
- `src/domain/analytics/consistency.js`: sequência de atividade e cumprimento das metas diárias.
- `src/domain/analytics/trends.js`: comparação de janelas equivalentes de desempenho.
- `src/domain/analytics/study-metrics.js`: consolidação pura de sessões, questões e simulados.
- `src/domain/analytics/heatmap.js`: intensidade e níveis do mapa de atividade por indicador.
- `src/domain/analytics/multidimensional-radar.js`: eixos, confiança e interpretação do radar comparativo.
- `src/domain/diagnostics/cognitive-profile.js`: perfil de erros com amostra, período, cobertura e confiança.
- `src/domain/diagnostics/risk-score.js`: risco composto com pesos redistribuídos, confiança e contribuições auditáveis.
- `src/domain/forecasts/performance-forecast.js`: faixa atual, distância até a meta e projeção conservadora de 30 dias com requisitos mínimos de evidência.
- `src/application/build-executive-summary.js`: modelo de apresentação do resumo executivo sem acesso ao DOM.
- `src/application/generate-diagnosis.js`: classificação explicável de gargalos, oportunidades, riscos e foco semanal.
- `src/application/recommend-study.js`: priorização normalizada e limitada pelo tempo disponível.
- `src/application/build-study-candidates.js`: composição única dos candidatos, riscos, evidências e elegibilidade.
- `src/application/build-study-plan.js`: proposta semanal até a prova, limitada por carga e disponibilidade.
- `src/application/replan-study.js`: cálculo de déficit e proposta de redistribuição sem mutação automática do plano.
- `src/application/planning/distribute-study-plan.js`: distribuição confirmável do plano semanal, materialização diária e desfazer protegido por execução.
- `src/domain/study-eligibility.js`: sessões curtas, manutenção de tópicos concluídos e validação transitiva de pré-requisitos.
- `src/application/sessions/session-service.js`: ciclo de vida das sessões e sincronização de questões, planejamento, histórico e recomendações.
- `src/application/records/record-service.js`: operações normalizadas para calendário, questões, simulados e metas.
- `src/application/subjects/subject-service.js`: ciclo de vida de disciplinas e tópicos, incluindo arquivamento auditável.
- `src/repositories/subjects-repository.js`: acesso à coleção e às entidades aninhadas de tópicos.
- `src/application/recommendations/outcome-service.js`: linha de base, resultado e confiança das recomendações sem ajuste automático de pesos.
- `src/domain/recommendations/recommendation-outcome.js`: comparação imutável entre os estados anterior e posterior, com deltas, confiança e estados de resultado.
- `src/application/subjects/exam-import-service.js`: preview e importação atômica de estruturas de edital com merge idempotente.
- `src/domain/exams/exam-presets.js`: catálogo versionado de estruturas BB, Caixa e combinada.
- `src/domain/analytics/recommendation-calibration.js`: leitura agregada dos resultados reais sem ajuste automático de pesos.
- `src/domain/forecasts/performance-scenarios.js`: simulações conservadoras de capacidade sobre a projeção de 30 dias.
- `src/ui/view-models/` e `src/ui/renderers/`: Questões, Agenda/Revisões, Calendário, calibração e cenários mantêm preparação de dados e HTML fora do composition root.
- `src/application/alert-lifecycle.js`: ordenação, limitação, dispensa temporária e resolução de alertas.
- `src/ui/accessibility.js`: rotulagem dinâmica e controle de foco em modais.
- `src/ui/controllers/navigation-controller.js`: abas, menu móvel, atalhos numéricos, busca e fechamento por Escape.
- `src/ui/controllers/modal-controller.js`: confirmações e prompts acessíveis com validação e restauração de foco.
- `src/ui/controllers/editable-collection-controller.js`: estado de rascunho e ciclo de edição dos registros operacionais.
- `src/ui/controllers/preferences-controller.js`: tema visual e persistência das preferências locais.
- `src/ui/controllers/backup-controller.js`: leitura, exportação e importação de arquivos de backup no navegador.
- `src/ui/controllers/delegated-events-controller.js`: roteamento seguro das ações declarativas da interface sem funções globais.
- `src/ui/renderers/application-renderer.js`: composição resiliente e seletiva das seções visuais.
- `src/application/goals/goal-service.js`: regras de metas globais e disponibilidade diária.
- `src/application/analytics/build-overview-view-model.js`: composição das métricas de tempo da Visão Geral sem dependência do DOM.
- `src/repositories/settings-repository.js`: alterações controladas das metas e configurações persistentes.
- `src/ui/list-components.js`: cabeçalhos agrupados e rodapés paginados reutilizáveis.
- `src/ui/filter-panel.js`: contagem e rótulos puros dos filtros responsivos.
- `src/ui/session-history.js`: filtragem e agrupamento puro do histórico de sessões.
- `src/reports/report-data.js`: snapshot estratégico filtrado por período e independente da interface.
- `src/reports/report-template.js`: template seguro do relatório A4.
- `src/reports/print-report.js`: coordenação isolada da impressão/“Salvar como PDF”.
- `src/app.js`: raiz de composição, compatibilidade dos fluxos legados e registro explícito das dependências.
- `src/app.bundle.js`: artefato gerado para permitir abertura direta por `file://`.
- `styles/print.css`: apresentação A4 do relatório exportado pela impressão do navegador.

## Fluxo de dependências

`app.js` pode importar `state`, `core`, `storage` e `domain`. Os módulos inferiores não devem importar a interface nem acessar o estado global da aplicação.

## Build e verificações

Após alterar qualquer arquivo em `src/`, execute no PowerShell:

```powershell
npm install
npm run build
npm run check
```

O bundle é gerado pelo esbuild e não deve ser editado manualmente. `build.ps1` é um atalho para `npm run build`.

## Persistência

IndexedDB é usado em conjunto com armazenamento local. Cada estado recebe `updatedAt`; o mais recente é carregado. Backups automáticos rotativos possuem checksum SHA-256. Antes de adotar dados locais ou importados, a aplicação migra e valida toda a estrutura. Abas abertas trocam versões por `BroadcastChannel`.

O schema 15 inclui `examBlueprint`, versões dos algoritmos, campos estratégicos dos tópicos, modo demonstrativo, vínculos auditáveis do planejamento, evidências das recomendações e o estado individual da revisão adaptativa. Dados ausentes são mantidos em estado neutro (`null`) e backups anteriores continuam sendo migrados automaticamente.

O Índice de Prontidão usa cobertura (30%), domínio (25%), retenção (20%), consistência (15%) e simulados (10%). Pesos de fatores indisponíveis são redistribuídos entre as evidências existentes; a ausência reduz a confiança, mas não produz nota zero.

## Auditoria final da modularização

- A interface não publica controladores no escopo global; a única exceção é `window.__EXTRATO_TEST__`, criada apenas com `?test=1` para a suíte legada.
- Eventos declarativos aceitam somente handlers registrados e argumentos previamente permitidos.
- Renderizadores de alto nível isolam falhas por seção, evitando que um cartão interrompa toda a tela.
- Alterações de metas, disciplinas, sessões, revisões, planejamento e registros operacionais passam por serviços e repositórios.
- Acesso técnico a IndexedDB, `localStorage`, `sessionStorage`, arquivos e impressão está contido em providers ou controladores de infraestrutura.
- `app.bundle.js` continua sendo artefato gerado; a fonte de verdade permanece nos módulos de `src/`.
