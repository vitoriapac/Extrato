# Refinamento visual: referência inicial

Referência de código anterior aos pacotes de refinamento: `066ac81`.

## Escopo protegido

Esta fase altera a apresentação da Visão Geral, da Configuração Inicial e de Desempenho. Os cálculos de Prontidão, prioridades, planejamento adaptativo, incidência e confiança, bem como snapshots e critérios de amostra, permanecem fora do escopo. Em Metas, somente o alvo semanal de consistência é persistido; o resultado é derivado das sessões existentes.

## Referências existentes

| Área | Referência automatizada | Estados cobertos |
| --- | --- | --- |
| Ação e alertas da Visão Geral | `tests/e2e/ux-baseline.spec.js` | Demo densa, desktop claro e mobile escuro |
| Hierarquia da Visão Geral | `tests/e2e/visual-regression.spec.js` | Demo densa em 375, 1366, 1440 e 1920 px |
| Configuração Inicial | `tests/e2e/onboarding.spec.js` | Primeiro uso, quatro etapas, claro/escuro, 375 e 1440 px |
| Visão Geral, Desempenho e Metas | `tests/e2e/final-visual-polish.spec.js` | Demo densa, claro/escuro, 320, 600, 900, 1100 e 1280 px; verificação de overflow |
| Contratos visuais compartilhados | `tests/e2e/visual-language.spec.js` | Claro/escuro, 375 e 1440 px |
| Desempenho e Metas refinados | `tests/e2e/refinement-visual.spec.js` | Seis visões na Demo densa, 375 e 1440 px, claro/escuro; grade de Metas em 375, 768 e 1440 px |

Os PNGs versionados em `tests/e2e/visual-regression.spec.js-snapshots/` são a referência visual prévia. As capturas de Ação × Atenção em `tests/e2e/ux-baseline.spec.js-snapshots/` foram atualizadas no Windows após o grid do pacote 2. O pacote 7 registra também capturas do resumo de Desempenho e da grade de Metas nos quatro cruzamentos de viewport e tema. No CI Linux, esses cenários verificam a estrutura, o empilhamento e a ausência de overflow; a rasterização das fontes continua específica de cada sistema operacional.

## Contratos para os pacotes 1–3

- A ordem de leitura e foco é Ação, Atenção, Configuração Inicial, Fase da prova.
- O CTA de estudo continua primário; alertas e onboarding têm ações secundárias.
- O layout não fixa altura de cards nem cria rolagem horizontal em 320–430 px.
- O estado das quatro etapas do onboarding vem do mesmo modelo; contagem, texto, símbolos e CTA não usam inferências por posição.
- O card de onboarding desaparece quando a configuração está completa; usuários com histórico ou plano continuam sem o convite inicial.

## Fechamento do pacote 7

Em 2026-10-01, `npm run check:all` passou no ambiente local: sintaxe válida, 475 testes unitários, artefatos reproduzíveis e 201 testes E2E. A revisão incluiu Demo densa, backup legado, estado sem questões ou simulados, seis visões de Desempenho, grade de Metas, teclado, claro/escuro e larguras de 320 a 1920 px. As oito capturas novas de Desempenho e Metas foram registradas no Windows; no Linux, o teste verifica a estrutura e o overflow sem depender da rasterização local das fontes.
