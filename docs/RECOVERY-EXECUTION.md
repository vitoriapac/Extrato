# Recovery e execução diária

## Timeline auditável

`build-recovery-timeline-detail.js` usa exclusivamente o registro confirmado da decisão. Origem, destino, carga, motivos, trajetória e versão do algoritmo não são reconstruídos com métricas atuais. Campos legados ausentes aparecem como não registrados.

Aplicação e reversão são eventos distintos. A reversão usa sua própria data e explica que o estudo já realizado foi preservado. A Timeline apresenta um resumo curto e detalhes recolhidos, mantendo os filtros e agrupamentos existentes. O componente compartilhado limita a lista inicial a cinco eventos.

A Timeline apenas apresenta os registros existentes; abrir detalhes não altera decisões nem recalcula seu histórico.
