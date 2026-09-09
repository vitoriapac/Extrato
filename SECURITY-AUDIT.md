# Auditoria de segurança — StudyTrack

## Estado atual

- A aplicação usa uma CSP por `meta` com `script-src 'self'`, `object-src 'none'`, `base-uri 'self'` e `form-action 'self'`.
- Eventos de interface são despachados por uma whitelist de handlers; handlers desconhecidos e payloads malformados são rejeitados.
- Conteúdo textual vindo do estado passa por `escapeHtml`/`escapeAttr` antes de ser inserido em HTML.
- Valores visuais dinâmicos ainda usam estilos inline controlados (largura de barras e progresso). Eles permanecem no escopo da política atual e serão migrados para propriedades CSS em etapa posterior.

## Próxima etapa

Mapear os estilos inline restantes, substituir valores fixos por classes e reduzir progressivamente `unsafe-inline` para estilos sem alterar os fluxos de gráficos, temas, modais e responsividade.
