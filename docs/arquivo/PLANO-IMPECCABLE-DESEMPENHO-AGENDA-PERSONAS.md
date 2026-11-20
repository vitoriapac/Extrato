# Plano: o que falta da crítica de Desempenho, Agenda e Calendário, e as personas

Origem: `.impeccable/critique/2026-11-03T19-50-59Z__index-html.md` (22/40, foco em Desempenho, Agenda e Calendário) e `.impeccable/critique/2026-11-03T18-15-05Z__index-html.md` (25/40, Visão geral). Continua o `PLANO-PENDENCIAS-CRITICA.md`, que fica como histórico.

## Onde estamos (2026-11-03)

Feito neste ciclo, sem commit ainda:

- Visão geral: 17 para 8 cards; Meta de hoje e Plano de hoje com o mesmo total; camada de decisão levada para Desempenho.
- Radar e Balanço: selo só com itens; "Sem evidência" em vez de "Equilibrada"; causa real no estado vazio.
- Agenda e Calendário fundidos na aba **Agenda** (duas seções, filtros de disciplina, status e mês compartilhados, abre no Mês, `#calendario` é alias).
- Tipografia: nenhum texto abaixo de 12px nos cards do cockpit; eixos do gráfico semanal a 12px; subabas de Desempenho a 44px.

Regra de execução: editar HTML e CSS só com a suíte e2e parada; depois de cada lote, `npm run build`, `npm run check:types`, `npm run lint`, `npm run test:unit` e os specs afetados. Antes de reutilizar uma classe de componente, procurar nos specs (`grep tests/e2e`): o bloco novo de Desempenho usava `today-analysis-details` e quebrou 11 testes que selecionam essa classe. Baselines visuais só depois de inspecionar a diferença. Um commit por lote, só com arquivos tocados, direto no `main`.

## Atualização do segundo ciclo (2026-11-03)

Feito depois da auditoria técnica (15/20):

- **4.1 Fontes locais**: Fraunces, IBM Plex Sans e Mono em `fonts/` (OFL), `styles/fonts.css`, pré-carga, cache no Service Worker e CSP sem hosts de fonte. Verificado: zero requisições externas.
- **1.1 e 1.2 Nomes acessíveis**: "Concluir" e "Editar" (revisões e tarefas) e "Treinar questões"/"Agendar revisão" nomeiam o tópico; teste unitário novo.
- **1.3 Limites**: alvo de 44px e nome próprio em cada "Limites".
- **1.5 Modal**: já existia (`#mainContent` fica `inert` com qualquer modal aberto); não mexido.
- **3.1 (parcial) Histórico**: Conquistas, tempo de estudo e sessões saíram da análise e viraram a subaba **Histórico** de Desempenho. Desempenho (Visão geral) caiu de 5.133px para 4.155px no desktop. A meta de 3.000px não foi atingida: o bloco de projeção (1.409px) e o gráfico de evolução do índice (850px) seguem abertos.
- **0.6 e 0.7**: DESIGN.md e sidecar atualizados; textos de ajuda falam em Agenda no Mês e em Histórico.

Verificado como falso positivo: o aviso `text-occlusion` de "Salvo" (o indicador fica por cima; o detector ignora o `position: fixed`).

Não feito (continua nos lotes): 1.4 legenda do calendário (mantida visível porque é a leitura textual das cores), 2.x comportamento, 3.2 a 3.5, 4.2 escala da serifa, 4.3 a 4.5, central de diagnóstico com 5 itens e "Mostrar mais" (decidida em shape, ainda não implementada) e marcadores do gráfico a 13px.

## Análise por persona

Cada linha é uma falha observada no app rodando em demo, e aponta o lote que a resolve.

### Alex, quem usa todo dia e quer velocidade

| Falha observada | Item |
|---|---|
| Sem atalho para "concluir o próximo atrasado" | 2.2 |
| Doze pares "Concluir / Editar" idênticos; nenhuma edição em lote | 2.3 |
| Filtros voltam a zero a cada visita | 2.4 |
| Radar e tabela repetem botões iguais ("Treinar questões" ×4) | 1.2 |
| Sem forma de recolher as camadas que não usa | já resolvido na Visão geral; Desempenho em 3.1 |

### Sam, teclado e leitor de tela

| Falha observada | Item |
|---|---|
| "Concluir" e "Editar" repetidos sem o tópico no nome acessível (inferido do texto, não testado com leitor de tela) | 1.1 |
| 37 `details` em Desempenho, vários com o resumo "Limites" ou "Ver evidências" ×5, indistinguíveis | 1.3 |
| "Limites" com 41px de largura (abaixo de 44px) | 1.3 |
| Legenda do mapa de calor do calendário lida inteira | 1.4 |
| Fundo da página continua na leitura com o modal de primeiro acesso aberto (a confirmar) | 1.5 |
| Contraste e foco do tema claro sem medição | 0.5 |
| Nenhuma checagem automática no tema escuro com dados (o `text-brand` a 1,13:1 passou) | 4.3 |

### Concurseira autodidata, uso diário

| Falha observada | Item |
|---|---|
| "9 atrasadas" sem ordem de importância para a prova | 2.1 |
| Desempenho pede mais de 5.000px para saber se está no caminho | 3.1 |
| Cabeçalho e banner empurram a Próxima ação para depois de ~560px no celular | 3.4 |
| Quatro números disputam a leitura (47/100, 90 dias, plano 1h20, 23 de 28 dias) | 3.5 |
| Corpo de 14px em sessões longas | 4.5 |

## Lote 0 — Fechar o ciclo atual (bloqueia o resto)

| # | Item | Comando | Critério de pronto |
|---|------|---------|--------------------|
| 0.1 | Ler o resultado do E2E dos arquivos afetados e corrigir o que for causado por este ciclo | `/impeccable audit` | Zero falhas novas; falhas antigas listadas à parte |
| 0.2 | Regravar os baselines que mudaram de propósito: `ux-baseline` (ação principal e Central de Diagnóstico) e os da Agenda | manual, depois de inspecionar | Diferença inspecionada e aprovada por quem decide; só esses arquivos mudam |
| 0.3 | Commit e push do ciclo | git | Commit só dos arquivos tocados, direto no `main`; `test:affected` verde |
| 0.4 | Confirmar duas exceções do detector: faixa de 3px no topo dos cards e wrappers de tabela (`cramped-padding`) | `/impeccable hooks ignore-value` | Decisão registrada com motivo; `dark-glow` e `wide-tracking` localizados antes de decidir |
| 0.5 | Validar o tema claro nas abas Visão geral, Desempenho e Agenda: contraste medido e captura | `/impeccable audit` | Pares de texto a 4,5:1 ou mais; capturas guardadas |
| 0.6 | Atualizar DESIGN.md (navegação com 8 abas, `.decision-fold`, vocabulário das revisões) e o sidecar `.impeccable/design.json` | `/impeccable document` | Sem aviso "DESIGN.md é mais novo que design.json" |
| 0.7 | Textos de ajuda que citam a aba Calendário | `/impeccable clarify` | Ajuda e atalhos falam em "Agenda, visão Mês" |

## Lote 1 — Pequenos e independentes (acessibilidade e repetição)

| # | Item | Comando | Onde | Critério de pronto |
|---|------|---------|------|--------------------|
| 1.1 | Nome acessível com o tópico em "Concluir" e "Editar" | `/impeccable harden` | `reviews-renderer`, `calendar-renderer` | `aria-label` "Concluir revisão de {tópico}"; teste unitário e axe sem violação |
| 1.2 | "Treinar questões" nomeia o tópico | `/impeccable clarify` | `CriticalVulnerabilitiesGrid.tsx` | Nome acessível distinto por linha; texto visível curto |
| 1.3 | Resumos de `details` distintos e botão "Limites" com 44px | `/impeccable harden` e `/impeccable adapt` | Desempenho (`limits-disclosure`, "Ver evidências") | Nenhum resumo repetido sem contexto; alvo de 44px |
| 1.4 | Legenda do calendário em uma frase para leitor de tela | `/impeccable harden` | `.cal-legend` | Legenda visual com `aria-hidden` e resumo textual único |
| 1.5 | Fundo inerte com o modal de primeiro acesso aberto | `/impeccable harden` | `FirstAccessModal.tsx` | `inert` (ou equivalente) no restante da página; teste e2e de foco |
| 1.6 | "Salvo" coberto pelo onboarding | `/impeccable polish` | `.save-indicator` | `text-occlusion` some do scan por URL |
| 1.7 | `h2` seguido de `h4` (já corrigido) e varredura dos outros saltos | `/impeccable audit` | Todas as abas | Zero `skipped-heading` |

## Lote 2 — Comportamento

| # | Item | Comando | Critério de pronto |
|---|------|---------|--------------------|
| 2.1 | Atrasadas ordenadas pela prova (incidência × domínio), não só por data | `/impeccable shape`, depois `/impeccable harden` | Mesmo dia ordena por impacto na prova, depois por nome; teste unitário; explicação em "Ver por quê" |
| 2.2 | Atalho Ctrl+K "Concluir o próximo atrasado" e "Iniciar estudo" | `/impeccable shape` | Ações na paleta; sem item, mensagem útil |
| 2.3 | Seleção em lote nas atrasadas (concluir e redistribuir) | `/impeccable shape` | Prévia antes de aplicar; desfazer por 10 s; teclado completo |
| 2.4 | Filtros da Agenda lembrados por navegador | `/impeccable harden` | Preferência de interface (não dado de estudo), com opção de limpar |
| 2.5 | Fim do grupo "Atrasadas" duplicado na tabela de revisões | `/impeccable distill` | Atrasadas listadas uma vez; teste de agrupamento ajustado |

## Lote 3 — Estrutura (cada item pede `shape` antes de código)

| # | Item | Comando | Critério de pronto |
|---|------|---------|--------------------|
| 3.1 | **Foco único em Desempenho**: um veredito, um gráfico e uma ação no topo; o resto em subabas ou blocos fechados; conquistas fora da análise de risco | `/impeccable shape`, `/impeccable layout`, `/impeccable distill` | Página abaixo de 3.000px no desktop; no máximo 4 blocos abertos; seções recolhidas lembradas |
| 3.2 | **Tabela única da Agenda** (fase 2 da fusão): tarefas e revisões num conjunto de linhas, com chip de origem | `/impeccable shape` | Um filtro de tipo; editores de cada origem reaproveitados; sem perda de dado |
| 3.3 | Agrupar a navegação em áreas (Hoje, Plano, Desempenho, Dados) | `/impeccable shape` | Decisão de produto confirmada antes; links por hash antigos continuam |
| 3.4 | Primeira dobra do celular: cabeçalho compacto e Próxima ação acima de ~560px | `/impeccable adapt` | Próxima ação visível sem rolar em 375×812 |
| 3.5 | Um herói de leitura na Visão geral | `/impeccable shape` | Decisão de qual número lidera; os outros viram apoio |

## Lote 4 — Sistema, privacidade e governança

| # | Item | Comando | Critério de pronto |
|---|------|---------|--------------------|
| 4.1 | **Fontes locais**: hospedar Fraunces, IBM Plex Sans e IBM Plex Mono no projeto e cachear no Service Worker | `/impeccable typeset` | Nenhuma requisição a `fonts.googleapis.com` ou `fonts.gstatic.com`; CSP sem esses hosts; offline com cache limpo mantém as fontes |
| 4.2 | Escala da serifa em 4 degraus por papel (hoje 17, 18, 22, 24, 28, 32 e `clamp`) | `/impeccable typeset` | Tokens por papel; nenhum tamanho solto |
| 4.3 | Checagem automática das regras do DESIGN.md e axe no tema escuro com dados da demo | `/impeccable harden` | Script falha com `text-[Npx]` abaixo de 12px, hex literal e `text-brand`; axe roda nos dois temas |
| 4.4 | Separar `--brand` (superfície) de `--text-brand`; aposentar as famílias paralelas `--wizard-*`, `--alerta-*`, `--month-*`, `--zebra-*` | `/impeccable extract` | O assistente usa `--surface-*`, `--text-*`, `--border-*`; nenhum componente usa `--brand` como cor de texto |
| 4.5 | Experimento de corpo a 15px no desktop | `/impeccable typeset` | Teste de uso com a usuária; só adotar se reduzir fadiga |

## Ordem e dependências

1. **Lote 0** primeiro: sem ele o resto parte de um estado que ninguém validou.
2. **Lote 1** em paralelo com o 4.3: são pequenos e protegem o que já foi feito.
3. **Lote 2.5** antes do **3.2**: a tabela única só faz sentido sem a lista duplicada.
4. **3.1** é a maior mudança de impacto; pedir `shape` e confirmar o recorte antes.
5. **4.1** é independente e protege a promessa de privacidade do produto; pode entrar a qualquer momento depois do Lote 0.

## Decisões pendentes (confirmar antes)

| # | Decisão | Proposta |
|---|---------|----------|
| D1 | Exceções do detector (0.4) | Aceitar as faixas de 3px e os wrappers de tabela como exceções documentadas |
| D2 | Navegação em áreas (3.3) | Manter as 8 abas até o 3.1 terminar; decidir depois |
| D3 | Tabela única (3.2) | Só depois de um período de uso da Agenda atual |
| D4 | Corpo a 15px (4.5) | Experimento, não padrão |

## Verificação final

1. `npm run check:types`, `npm run lint` e `npm run test:unit` sem falhas.
2. `npm run test:affected` e a suíte e2e completa.
3. Nova `/impeccable critique` em Desempenho, Agenda e Calendário (meta: 30/40 ou mais) e na Visão geral (meta: 32/40 ou mais).
4. Persona a persona: refazer a caminhada de Alex, Sam e da concurseira e conferir as linhas da tabela de personas.
5. Commit só dos arquivos tocados, direto no `main`.
