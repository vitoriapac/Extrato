# Plano: pendências da crítica de design (28/40)

Origem: `.impeccable/critique/2026-11-02T19-06-08Z__index-html.md`. Papel da Visão geral: resumo visual de KPIs, prontidão e resumo; análise detalhada em Hoje e Desempenho.

Regra de execução: editar HTML e CSS só com a suíte e2e parada; depois de cada lote, `npm run build`, `npm run check:types`, `npm test` e os specs afetados. Atualizar baselines visuais só depois de inspecionar o diff e registrar em `docs/VISUAL-TEST-POLICY.md`.

## Lote 1 — pequenos e independentes

| # | Item | Onde | Critério de pronto |
|---|------|------|--------------------|
| 1.1 | Ligar a busca nos selects de disciplina | `index.html`: `data-searchable` em `#timerSubjectSelect`, `#calFilterSubject`, `#agendaFilterSubject`; CSS `.select-search` | Com 9+ opções aparece o campo; digitar esconde as demais; o valor selecionado não muda |
| 1.2 | "Nº do plano" cortado no celular | `styles/app.css`, `.statement-account` | Sem corte e sem rolagem horizontal em 375px |
| 1.3 | Banner da demonstração quebra em 1024px | `.demo-banner` | Uma linha ou quebra limpa em 1024px |
| 1.4 | Desempate nas gravidades (empates em 97) | ordenação do diagnóstico consolidado | Mesmo score ordena por impacto na prova, depois por nome; teste unitário |
| 1.5 | "Dados insuficientes" acima de "Crítico" | mesma ordenação | Crítico/alto antes de evidência insuficiente; teste unitário |
| 1.6 | Glossário sem "retrato" | `src/domain/help` (termos) | Termo definido e achado na busca da Ajuda |
| 1.7 | `role=status` com texto antigo | `#performanceStatus`, `#weeklyRecordStatus` | Região limpa ao trocar de aba |
| 1.8 | Dica de atalhos do rodapé minúscula no desktop | rodapé | Texto em 12px ou mais, contraste AA |

## Lote 2 — comportamento

| # | Item | Critério de pronto |
|---|------|--------------------|
| 2.1 | Carimbo depois do "Desfazer" do fechamento semanal | Mostra "DESFEITO" com data; a semana volta a "em aberto"; teste e2e em `strategic-cycle.spec.js` |
| 2.2 | "Iniciar estudo" no Ctrl+K | Ação abre o primeiro item do plano de hoje; sem plano, abre Sessão livre |
| 2.3 | `details` de evidência sob demanda | Evidências de cada linha entram em `<template data-lazy>`; contagem de nós de `#diagnosisCenter` cai em pelo menos 50% (medir antes e depois) |

## Lote 3 — decisões de produto (confirmar antes)

| # | Item | Proposta | Pergunta |
|---|------|----------|----------|
| 3.1 | Atrasadas em dois lugares | Lista só na Agenda; Hoje e Calendário mostram contador com link | Confirmar a Agenda como casa |
| 3.2 | Resumo executivo repete a próxima ação | Trocar "Maior ganho" por um link para Hoje | Manter ou remover o bloco |
| 3.3 | 9 abas + 5 subabas | Agrupar abas secundárias em "Mais"; reduzir as subabas | Quais abas ficam no primeiro nível |

## Verificação final

1. `npm run check:types` e `npm test` sem falhas.
2. Specs afetados: `strategic-cycle`, `consolidated-signals`, `visual-regression`, `ux-baseline`, `action-first-mobile`.
3. Suíte e2e completa.
4. Nova `/impeccable critique` para medir a nota (meta: 32/40 ou mais).
5. Commit só dos arquivos tocados, direto no `main`.

## Decisões do Lote 3 (2026-11-02)

- 3.1 Atrasadas: lista só na Agenda; Hoje e Calendário mostram contador com link.
- 3.2 Resumo executivo: trocar "Maior ganho pelo diagnóstico" por link para Hoje; fica riscos e oportunidades.
- 3.3 Navegação: manter as 9 abas; transformar as 5 subabas em seções recolhíveis.
