# Design System do StudyTrack

O StudyTrack usa a linguagem visual de um extrato: navy para estrutura, dourado para destaque, papel para superfícies e linhas finas para separar informação.

## Tipografia

- Fraunces: marca e valores principais.
- IBM Plex Mono: métricas, datas, estados e títulos de seção.
- IBM Plex Sans: textos, formulários e explicações.
- Pesos semânticos: regular 400, medium 500 e semibold 600.

## Espaçamento

A escala oficial é 4, 8, 12, 16, 20, 24 e 32 px, exposta nos tokens `--space-1` a `--space-8`.

## Componentes

- `btn`: ação principal; use `ghost`, `danger`, `small` e botões de ícone conforme o contexto.
- `chart-card`: agrupamento lógico de dados.
- `kpi-cell` e `mini-stat`: métricas padrão e compactas.
- `empty-state--compact`: ausência de dados com explicação curta.
- `bar-track` e `bar-fill`: progresso e distribuição.
- `section-head` e `overview-section-heading`: títulos estruturais.
- `compact-header` e `compact-meta`: resumo persistente do plano.
- `diagnostic-row`: tópico, score, evidência e explicação em níveis distintos.
- `backup-danger-zone`: ações destrutivas separadas das operações de recuperação.

Cards representam agrupamentos. Dentro deles, use linhas, espaço e tipografia para estabelecer hierarquia em vez de criar novos cards.

## Temas e responsividade

Todo componente deve usar tokens de cor, preservar contraste em ambos os temas e funcionar a partir de 375 px sem rolagem horizontal global.
