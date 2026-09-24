# Auditoria de segurança — StudyTrack

## Estado atual

- A CSP é declarada por `meta`: `script-src 'self'`, `worker-src 'self'`, `object-src 'none'`, `base-uri 'self'` e `form-action 'self'`. Scripts inline não são permitidos.
- `style-src-attr 'unsafe-inline'` continua habilitado para atributos `style` usados por gráficos e indicadores com valores dinâmicos, como larguras de barras e progresso. A política de estilos inline ainda não foi reduzida.
- Eventos declarativos são despachados por uma whitelist de handlers; handlers desconhecidos e payloads malformados são rejeitados.
- Conteúdo textual vindo do estado passa por `escapeHtml`/`escapeAttr` antes de ser inserido em HTML.
- O Service Worker usa stale-while-revalidate para assets estáticos e prioriza a rede em navegações, com fallback offline.

## Pendência de CSP

Mapear os atributos `style` restantes, substituir os valores que possam usar classes ou regras de CSS e avaliar separadamente os valores dinâmicos de gráficos. Após essa migração, remover `style-src-attr 'unsafe-inline'` e validar cronômetro, gráficos, temas, modais e responsividade sob a política restrita. Até lá, a permissão permanece explicitamente necessária para os estilos inline existentes.

## Cache PWA

O build calcula um fingerprint determinístico dos fontes e assets e o aplica ao nome do cache, às URLs versionadas do CSS e dos bundles, inclusive ao catálogo carregado sob demanda. O `service-worker.js` é gerado a partir de `service-worker.template.js`, e o deploy do Pages executa o build antes de publicar. Caches com versões anteriores são removidos durante a ativação do Service Worker.
