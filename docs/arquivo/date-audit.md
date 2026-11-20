# Auditoria de datas

O projeto trata datas civis (`YYYY-MM-DD`) e instantes absolutos (timestamps ISO) como conceitos diferentes.

## Datas civis

Datas de prova, sessões, revisões, calendário e filtros diários passam por `src/core/date-utils.js`. Cálculos de dia da semana e diferenças entre dias usam `parseLocalDate`, que cria a data ao meio-dia local e valida o calendário. A auditoria removeu as construções residuais `new Date(date + 'T00:00:00')` dos alertas inteligentes.

O calendário mensal ainda usa `new Date(year, month, day)` de forma intencional: ele constrói células no calendário local a partir de componentes civis e nunca serializa o resultado como UTC.

## Instantes absolutos

`Date.parse`, `new Date(timestamp)` e `toISOString()` permanecem nos fluxos de backup, sincronização entre abas, cronômetro, auditoria, criação e conclusão de registros. Nesses casos o valor representa um instante absoluto e a conversão UTC é esperada.

## Regra para novas alterações

- Use `parseLocalDate`, `formatLocalDate` e `addLocalDays` para valores `YYYY-MM-DD`.
- Use o relógio da aplicação e timestamps ISO para eventos com hora.
- Não acrescente sufixos `T00:00:00` ou `Z` a uma data civil para fazer cálculos.
