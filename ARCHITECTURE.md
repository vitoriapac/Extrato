# Arquitetura

O aplicativo continua executando inteiramente no navegador e sem dependências externas de JavaScript.

## Estrutura

- `index.html`: marcação e pontos de montagem da interface.
- `styles/tokens.css`: cores, temas e tokens visuais.
- `styles/app.css`: layout e componentes.
- `src/theme-bootstrap.js`: aplica o tema antes da primeira pintura.
- `src/bootstrap.js`: executa a inicialização com contexto explícito e contenção de falhas.
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
- `src/application/build-study-plan.js`: proposta semanal até a prova, limitada por carga e disponibilidade.
- `src/application/replan-study.js`: cálculo de déficit e proposta de redistribuição sem mutação automática do plano.
- `src/application/planning/distribute-study-plan.js`: distribuição confirmável do plano semanal, materialização diária e desfazer protegido por execução.
- `src/application/sessions/session-service.js`: ciclo de vida das sessões e sincronização de questões, planejamento, histórico e recomendações.
- `src/application/records/record-service.js`: operações normalizadas para calendário, questões, simulados e metas.
- `src/application/recommendations/outcome-service.js`: linha de base, resultado e confiança das recomendações sem ajuste automático de pesos.
- `src/application/alert-lifecycle.js`: ordenação, limitação, dispensa temporária e resolução de alertas.
- `src/ui/accessibility.js`: rotulagem dinâmica e controle de foco em modais.
- `src/ui/list-components.js`: cabeçalhos agrupados e rodapés paginados reutilizáveis.
- `src/ui/filter-panel.js`: contagem e rótulos puros dos filtros responsivos.
- `src/ui/session-history.js`: filtragem e agrupamento puro do histórico de sessões.
- `src/reports/report-data.js`: snapshot estratégico filtrado por período e independente da interface.
- `src/reports/report-template.js`: template seguro do relatório A4.
- `src/reports/print-report.js`: coordenação isolada da impressão/“Salvar como PDF”.
- `src/app.js`: composição temporária da interface e funcionalidades ainda não extraídas.
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
