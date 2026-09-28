# Design System do StudyTrack

O StudyTrack usa a linguagem visual de um extrato: navy para estrutura, dourado para destaque, papel para superfícies e linhas finas para separar informação.

## Tipografia

- Fraunces: marca e valores principais.
- IBM Plex Mono: métricas, datas, estados e títulos de seção.
- IBM Plex Sans: textos, formulários e explicações.
- Pesos semânticos: regular 400, medium 500 e semibold 600.

## Espaçamento

A escala oficial é 4, 8, 12, 16, 20, 24 e 32 px, exposta nos tokens `--space-1` a `--space-8`.

As superfícies, textos, divisores e estados semânticos também têm aliases (`--surface-*`, `--text-*`, `--border-subtle` e `--status-*`). Use esses papéis em componentes novos ou revisados; os aliases continuam ligados às cores do tema ativo. `--surface-card`, `--surface-card-muted`, `--surface-interactive`, `--text-inverse` e `--status-insufficient` completam os papéis de superfície, texto e evidência insuficiente nos dois temas.

## Componentes

- `btn`: ação principal; use `ghost`, `danger`, `small` e botões de ícone conforme o contexto.
- Estados dos botões: hover, foco visível, active e disabled são comuns; `btn` é primário, `btn ghost` secundário, `btn danger` destrutivo e `icon-btn` para ações somente por ícone.
- `card`, `card__header`, `card__body` e `card__footer`: estrutura compartilhada; use variantes `card--action`, `card--interactive` ou `card--muted` quando a função justificar.
- `status-badge`: sinal textual semântico; use `--danger`, `--warning`, `--success`, `--info` ou `--insufficient`. A cor nunca deve ser o único indicador.
- `chart-card`: agrupamento lógico de dados.
- `kpi-cell` e `mini-stat`: métricas padrão e compactas.
- `empty-state--compact`: ausência de dados com explicação curta.
- `bar-track` e `bar-fill`: progresso e distribuição.
- `section-head` e `overview-section-heading`: títulos estruturais.
- `compact-header` e `compact-meta`: resumo persistente do plano.
- `diagnostic-row`: tópico, sinal textual, score, evidência, explicação e ação contextual em níveis distintos; os dados semânticos vêm do view-model.
- `backup-danger-zone`: ações destrutivas separadas das operações de recuperação.
- `select-control`: aparência comum dos seletores, com variantes `--compact` e `--wide`.
- `data-row`: histórico traduzido com título, ação e estado.
- `weekly-assessment` e `period-comparison`: interpretação semanal e deltas por unidade.
- `Header`: um único modelo alimenta as apresentações hero e compacta.
- `exam-subject-row`: nome e quatro campos estratégicos alinhados em uma linha no desktop e empilhados no mobile; valores ausentes comunicam herança da meta geral.

Cards representam agrupamentos. Dentro deles, use linhas, espaço e tipografia para estabelecer hierarquia em vez de criar novos cards.

## Temas e responsividade

Todo componente deve usar tokens de cor, preservar contraste em ambos os temas e funcionar a partir de 320 px sem rolagem horizontal global. Para listas, formulários e diagnósticos, permita quebra de nomes longos e empilhe conteúdo antes de reduzir a área de toque.

## Listas progressivas

Listas de registros usam DEFAULT_LIST_VISIBLE_ITEMS (5), definido em src/ui/progressive-list.js. Até cinco registros ficam visíveis; a partir de seis, o controle secundário mostra “Mostrar mais · +N” e expande a coleção completa. “Mostrar menos” recolhe e mantém o foco.

Aplicar escopo, filtros, busca e ordenação antes da apresentação. Sessões, questões, simulados e decisões priorizam os mais recentes; revisões mantêm urgência; lacunas mantêm prioridade. Filtros e navegação recolhem as listas. O estado é transitório e não integra armazenamento ou backups. Atualizações de dados recalculam a contagem.

Categorias: progressive-list para registros; always-visible para indicadores, gráficos, matrizes, comparações, navegação e conquistas; paginated-list para grandes coleções. A revisão de classificações históricas mantém paginação de 100 questões. As três recomendações escolhidas para hoje são uma seleção do motor, não uma lista de registros.

O adaptador mountProgressiveLists usa uma relação explícita de seletores e registros, sem aplicar limites a cards arbitrários. Novos módulos devem aderir à mesma constante e controles. Botões reais expõem aria-expanded e aria-controls, foco visível e área mínima de 44 px. Recolhimento só rola quando o controle fica fora da viewport, respeitando prefers-reduced-motion.

## Contrato compartilhado dos gráficos

Use renderChartFrame de src/ui/chart-components.js para título (module-heading), descrição, período, legenda, evidência, visualização e registros textuais. renderChartEmptyState apresenta a evidência necessária; renderChartTooltip escapa os detalhes dos pontos SVG. Os seletores existentes mantêm os próprios eventos e usam chart-period-controls.

Os tokens --chart-series-primary, --chart-series-secondary e --chart-series-target definem os papéis visuais nos dois temas. Questões, Simulados e Plano e execução usam esse contrato. A legenda deve corresponder às séries e a consulta textual precisa informar valores e unidades. A cor não pode ser a única forma de interpretar o gráfico.

### Inventário de componentes

| Papel | Contrato existente |
|---|---|
| Cards e análise | card, chart-card, module-heading |
| Indicadores | kpi-cell, mini-stat |
| Estados e evidência | status-badge, context-note, empty-state |
| Ações e campos | btn, select-control, controles existentes |
| Progresso | bar-track, bar-fill |
| Listas de registros | progressive-list.js e list-components.js |
| Gráficos | chart-components.js, chart-frame, chart-period-controls |
| Diálogos | modal-overlay e controladores existentes de foco |

Componentes novos devem reutilizar esses contratos antes de criar variantes. Matrizes e comparações mantêm a visualização simultânea dos dados.

## Histórico explicável de prontidão

O resumo distingue cálculo atual, último registro salvo, variação entre fechamentos e melhor registro comparável. Registros de alterações estratégicas não entram na comparação entre fechamentos. A comparação só ocorre quando algoritmo, pesos e disponibilidade dos fatores coincidem. A linha do gráfico se interrompe quando a base muda; nenhum registro antigo é recalculado. O detalhamento mostra pontuação anterior e atual e contribuição ponderada de cada fator.

Capturas ocorrem no fechamento e antes de mudanças na data/meta da prova, concurso ativo, configuração de disciplina, impacto/esforço/pré-requisitos de tópico e confirmação ou reversão do plano semanal. Aceitar prioridades do fechamento captura a prontidão antes de alterar o plano. Mudanças sem valor disponível não geram snapshots; re-renderizações não geram capturas. Uma migração futura do algoritmo deve preservar os snapshots e usar um evento explícito, sem reconstrução retroativa.

## Explicações de recomendações

renderRecommendationExplanation usa quatro perguntas: o que fazer, por que, evidências e o que muda ao aceitar. As consequências são operacionais e não garantem desempenho. A Visão Geral, Hoje, diagnóstico com ação vinculada e adaptações reutilizam o contrato. Histórico mostra explanationSnapshot; registros antigos mantêm apenas as razões que de fato foram salvas. Detalhamento da composição matemática continua disponível na recomendação de Hoje.
