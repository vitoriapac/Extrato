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
