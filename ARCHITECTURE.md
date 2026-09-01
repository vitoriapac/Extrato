# Arquitetura

O aplicativo continua executando inteiramente no navegador e sem dependências externas de JavaScript.

## Estrutura

- `index.html`: marcação e pontos de montagem da interface.
- `styles/tokens.css`: cores, temas e tokens visuais.
- `styles/app.css`: layout e componentes.
- `src/theme-bootstrap.js`: aplica o tema antes da primeira pintura.
- `src/state/schema.js`: contrato do estado, versões, enums e chaves de armazenamento.
- `src/state/defaults.js`: fábrica do estado inicial, sem compartilhar referências mutáveis.
- `src/state/strategic.js`: normalização do plano de prova, importância/esforço dos tópicos e versões dos algoritmos.
- `src/core/utils.js`: utilidades puras e validações primitivas.
- `src/storage/repository.js`: acesso a IndexedDB, `localStorage` e `window.storage`.
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
- `src/application/build-executive-summary.js`: modelo de apresentação do resumo executivo sem acesso ao DOM.
- `src/application/generate-diagnosis.js`: classificação explicável de gargalos, oportunidades, riscos e foco semanal.
- `src/application/recommend-study.js`: priorização normalizada e limitada pelo tempo disponível.
- `src/ui/accessibility.js`: rotulagem dinâmica e controle de foco em modais.
- `src/ui/list-components.js`: cabeçalhos agrupados e rodapés paginados reutilizáveis.
- `src/ui/filter-panel.js`: contagem e rótulos puros dos filtros responsivos.
- `src/ui/session-history.js`: filtragem e agrupamento puro do histórico de sessões.
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

O schema 9 introduz `examBlueprint`, `algorithmVersions` e os campos estratégicos dos tópicos. Dados ausentes são mantidos em estado neutro (`null`) e backups anteriores continuam sendo migrados automaticamente.

O Índice de Prontidão usa cobertura (30%), domínio (25%), retenção (20%), consistência (15%) e simulados (10%). Pesos de fatores indisponíveis são redistribuídos entre as evidências existentes; a ausência reduz a confiança, mas não produz nota zero.
