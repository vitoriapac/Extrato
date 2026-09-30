# Fundação visual — pacote 1

Este pacote estabelece a base para reorganizar Metas, Desempenho e as demais áreas. Não altera fórmulas, navegação principal ou persistência. A inspeção abaixo é do código atual; a validação visual com dados densos permanece necessária em cada pacote de tela.

## Contrato de superfícies

| Papel | Token | Uso |
| --- | --- | --- |
| Página | `--surface-page` | Fundo bege no claro e fundo escuro da aplicação. |
| Card | `--surface-card` | Unidade independente sobre a página. |
| Subárea | `--surface-subtle` | Evidência e controles dentro de uma unidade. |
| Destaque | `--surface-highlight` | Atenção sem competir com a ação principal. |
| Primária | `--surface-primary` | Uma decisão ou resultado dominante. |

Texto, bordas e acentos usam `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-primary`, `--border-default`, `--border-emphasis`, `--accent-primary` e `--accent-warning`. Todos se resolvem a partir dos tokens de tema existentes; não há cor branca literal nos componentes. Os tokens legados continuam disponíveis durante a migração, para não mudar telas não revisadas.

## Espaçamento e componentes

A escala canônica é 4, 8, 12, 16, 24, 32, 48 e 64 px (`--space-1/2/3/4/6/8/12/16`). `--space-5` continua como legado de 20 px até que os módulos antigos sejam migrados. Use 8 px para ícone/texto, 12 px para label/controle, 16 px para itens relacionados, 24 px para grupos internos, 32 px entre cabeçalho e conteúdo e 48–64 px entre seções independentes. Os blocos existentes com medidas próprias serão convertidos junto de suas páginas, sem uma substituição global.

- `.card` é a base. `.card--default`, `--insight`, `--attention` e `--primary` são as quatro variantes. `--insight` e `--attention` mantêm texto descritivo; a cor não é o único sinal de significado. `.card--action` e `.card--muted` permanecem como aliases legados.
- `renderSectionHeader`, `renderEmptyState` e `renderMetricCard` em `src/ui/components/presentation.js` centralizam HTML e escape de texto. `module-heading` continua sendo o cabeçalho existente; `.ui-section-header` fornece o ritmo editorial para novas seções.
- `.ui-metric-group`/`.ui-metric`, `.ui-progress`, `.ui-filter-bar`, `.ui-data-table` e `.ui-action-menu` são contratos reutilizáveis. Barras exigem valor textual próximo ou nome/valor acessíveis. Tabelas largas ficam em região com rolagem por teclado; o menu de ação deve manter nome e foco explícitos.
- Estados vazios devem dizer qual dado falta e qual registro ou ação o produz. O componente não inventa métricas ausentes.

Gráficos e Desempenho já usam os renderers compartilhados. A barra de filtros, a faixa de métricas e a tabela de Desempenho usam as classes comuns sem perder os estilos específicos da visão. Os próximos pacotes devem trocar um componente antigo quando revisarem sua página, removendo a regra antiga correspondente.

## Inventário de migração

| Área | Base atual | Próxima aplicação |
| --- | --- | --- |
| Visão Geral/Hoje | Hero, cartões de ação e sinais têm hierarquia própria. | Distinguir ação principal de alerta auxiliar no pacote 7. |
| Metas | Capacidade, plano, execução, metas ativas e fechamento seguem a nova ordem. | Refinar detalhes e verificar cenários densos no gate final. |
| Desempenho | Filtros com concurso explícito, resumo compacto por disciplina, tabela detalhada e estado de amostra com limiar real. | Verificar dados densos e acessibilidade no gate final. |
| Inteligência da Prova | Saúde, incidência × domínio, divergência e importação estão em Desempenho; a configuração permanece em Metas. | Refinar leitura e verificar cenários densos no gate final. |
| Instruções | Seis cards estáticos selecionam um capítulo; a busca alcança todo o conteúdo e o glossário. | Verificar mobile e teclado no gate final. |
| Disciplinas/Questões | Cadastro e análises têm ações e tabelas próprias. | Reduzir ações concorrentes nos pacotes 6–7. |

Cada tela migrada precisa ser revista no claro e no escuro, sem dados e com Demo densa, em desktop, tablet e 320–430 px. O inventário registra responsabilidades; não afirma que uma captura visual tenha sido feita neste pacote.

## Verificação local

`npm run check:all` passou em America/Sao_Paulo: 471 testes unitários, 185 E2E, sintaxe válida e artefatos reproduzíveis. A suíte cobre Demo com dados densos, baselines visuais, temas, acessibilidade e responsividade. A migração das telas dos pacotes seguintes exige nova inspeção depois de cada mudança de layout.
