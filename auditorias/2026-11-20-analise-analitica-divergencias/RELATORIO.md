# Análise de usuário analítico: divergências, redundâncias e repetições

Data: 20/11/2026 · App em `http://127.0.0.1:4173` (build local) · Viewports 1440×900 e 375×812 · Idioma pt-BR

**Método:** ⚠️ DEGRADED: single-context. A skill pede dois sub-agentes isolados (A: revisão de design, B: detector). Executei tudo numa única passada, sem sub-agentes, e **não rodei `impeccable detect`**. Portanto este relatório é só a avaliação A (leitura do texto renderizado de cada aba, mais capturas de tela). Ele não cobre CSS/markup. Não corri axe nem Lighthouse.

**Roteiro:**
1. Primeira visita, `localStorage` limpo, sem dados.
2. Modo Demonstração (Explorar demonstração → Carregar demonstração, 140 dias, 17 disciplinas).
3. Percorri todas as 8 abas e as subabas de Desempenho, Planejamento e Hoje.
4. Conferi cada número que aparece em mais de um lugar contra os outros.

---

## 1. Veredito em uma página

O app calcula quase tudo certo. Os totais fecham, por exemplo 63+67+64+111 = 305 tópicos e 316/463 = 68,3%. O problema é que ele **diz a mesma coisa 4 a 6 vezes, com números que não batem entre si**, e chama de "prioridade" cinco itens diferentes.

Um analista que confere o painel desconfia do app antes de desconfiar dos próprios dados. Isso fere o princípio nº 3 do PRODUCT.md ("Uma prioridade só").

| Eixo | Nota | Leitura |
|---|---|---|
| Divergências numéricas | Alta gravidade | Mesma grandeza, valores e janelas diferentes, sem rótulo que explique |
| Prioridade única | Alta gravidade | Pelo menos 5 "próximos passos" concorrentes |
| Redundância de blocos | Média/alta | "9 atrasadas" em 8 pontos; Ciclo de Estudos duplicado; sugestão Analytics repetida |
| Repetição em vazio | Média | 4 botões "Explorar demonstração"; 7 mensagens "nenhum/ainda não" na Agenda |
| Vocabulário | Média | Tarefa × Revisão, "Planos" × "Planejamento", "Resultados das provas" que contém questões |
| Demo | Baixa/média | Dados sintéticos regulares demais (toda sessão com 20 questões) |

---

## 2. Divergências numéricas (mesma grandeza, valores diferentes)

### D1 · P0 · "Próxima ação" tem três respostas
| Onde | O que diz |
|---|---|
| Visão geral › Próxima ação | **Língua Portuguesa · Interpretação** (45 min, "prevista no plano de hoje") |
| Hoje › Plano de hoje | LP Interpretação 45 min + Inglês 35 min |
| Hoje › Estratégia | **Tecnologia e IA · Analytics**, "FORA DO PLANO DE HOJE · #1" |
| Desempenho › Resumo | "A próxima ação é **Analytics**, em Hoje" · "No plano: não" |
| Desempenho › Diagnóstico | "A Próxima ação (Analytics) **vem do plano de hoje**" |

O Diagnóstico contradiz diretamente o Hoje: o Hoje diz que Analytics está fora do plano. E o texto "A ação de hoje é a Próxima ação" (Desempenho) aponta para o item errado.

**Fix:** uma função `nextAction` com o rótulo "Próxima ação (plano)" e outro, secundário, "Sugestão fora do plano". Todas as telas devem consumir os mesmos dois campos, com os mesmos nomes.

### D2 · P1 · Cinco "prioridades" em abas diferentes
Língua Portuguesa/Interpretação (plano), Analytics (sugestão), **Garantias bancárias** (fila #1 do Diagnóstico), **Classes de palavras** (Foco da próxima semana, Fechamento semanal) e **Juros compostos** (Questões › "Onde vale insistir", 45,3%).

Ainda dentro do Fechamento: "Classes de palavras" aparece como *lacuna*, mas a demo registra **85%** de acerto nele ("Você: 17 acertos em 20 (85%) antes da recomendação"). Isso está acima da meta de 80%. O mesmo vale para Redes sociais (85%). Recomendar reforço de um tópico acima da meta contraria a lógica do Diagnóstico.

### D3 · P1 · Contagem de "atrasadas": 9 × 7
- Visão geral (Atenção): "**9 revisões** atrasadas"
- Hoje (Replanejamento): "9 revisões pendentes"
- Hoje (REVISÕES PARA REGULARIZAR): "9 pendências · **7 revisões + 2 tarefas**"
- Desempenho (Resumo e Diagnóstico): "**7 revisões** vencidas"
- Agenda: "9 VENCIDAS · 7 revisões + 2 tarefas"

Os mesmos itens são chamados de "revisões" (9) em umas telas e de "revisões" (7) em outras. O texto "Conclua primeiro as revisões vencidas" manda concluir 9 revisões, quando só 7 são revisões.

### D4 · P1 · Acerto por disciplina: 3 a 4 valores para a mesma matéria

| Disciplina | Visão geral (4 sem.) | Disciplinas ("última janela") | Desempenho (30 d) | Planejamento |
|---|---|---|---|---|
| Língua Portuguesa | 71,7% (7 d) | 71,7% | 72,1% (e **72,0%** na lista de Resultados) | 72,1% |
| Matemática | 61,5% | 55,0% | 55,0% | 55% |
| Produtos e Serviços Bancários | **71,1%** | **85,0%** | n/d | n/d |
| Atendimento Bancário | 66,3% | 73,2% | n/d | n/d |
| Banco do Brasil — Específicos | **47,6%** | (sem valor) | n/d | n/d |

Cada fonte usa uma janela diferente: 4 semanas, "última janela", 30 dias, 7 dias. Só a Visão geral rotula a janela. A diferença 71,1% × 85,0% muda a leitura de "abaixo da meta" para "acima".

### D5 · P1 · "Abaixo da meta": 16 × 7
Visão geral: "**16 abaixo da meta**" (Saúde do Edital por Disciplina, mas só 5 aparecem). Desempenho › Por disciplina: "12 de 17 com amostra · **7 abaixo da meta** com dados suficientes". Os critérios de elegibilidade diferem e nenhum é explicado onde o número aparece.

### D6 · P1 · Simulados: 5 valores
- Questões › KPI: **81%** (simulados comparáveis · estimativa)
- Desempenho › Resumo: "resultado central dos simulados comparáveis (**81%**)"
- Questões › cartão: Média recente **73,0%**; Melhor/Último **84,0%**
- Tabela do mesmo bloco: Simulado 9 = **83,8%**
- Visão geral: "média de **72,9%** em 9 simulados · … **na meta (+3,8 p.p.)**"
- Visão geral (rodapé do gráfico): "Rendimento recente de **83,8%** alinhado à meta"

A frase "63,6% de acerto em 1750 questões · … · na meta (+3,8 p.p.)" junta duas coisas: 63,6% e 72,9% estão abaixo de 80%, mas o texto diz "na meta". 84,0% × 83,8% é arredondamento inconsistente do mesmo dado.

### D7 · P2 · Janelas de tempo misturadas na mesma tela
Desempenho › Resumo, com o filtro em "Últimos 30 dias": o bloco "Como sua preparação evoluiu" mostra "34 h 18 min · 463 questões" com o rótulo "**6 semanas completas**". Esses valores são os do período de 30 dias (confirmado em Ritmo e aderência: "Últimos 30 dias: 34 h 18 min… 24 dias com estudo"). O rótulo "6 semanas" está errado ou refere-se a outra base.

Na mesma tela convivem 7 d, 30 d, 90 d e "6 semanas". O app assume isso ("Janelas diferentes: …"), mas a Prontidão e a faixa projetada vêm de janelas distintas.

### D8 · P2 · Progresso até a prova: 61% × 25%
Cabeçalho: barra **61%** ("229 dias totais · 139 passaram · 90 faltam"). Planejamento › Prova e metas: "**25% do cronograma decorrido**". São duas bases (tempo total × fases), com o mesmo vocabulário.

### D9 · P2 · Aderência: 83% / 87,5% / 71% / 86%
Visão geral "Aderência ao plano 83%" (7 d); Fechamento semanal "**87,5%**" (semana até hoje); "**71%** das prioridades executadas" (Semana); retrato S5 "foco **86%**". São quatro métricas legítimas com o mesmo nome ("aderência"/"execução") e sem tabela de equivalência na tela.

### D10 · P2 · "Faltam X" com X diferente
Faltam **1 h 56 min** (capacidade da semana) · **4 h 6 min** (tarefas marcadas) · **2 h 30 min** (igualar o planejado, 7 d) · **12 h 12 min** (30 d). E o texto "perto do que o plano previa" convive com "Faltam 2 h 30 min".

### D11 · P2 · Evidência: alta / média / baixa para a mesma recomendação
Cabeçalho: "Evidência do índice: **média** · 5 de 5 fatores". Visão geral › Leitura do Extrato: "**evidência alta**". No mesmo cartão: "Prioridade 78/100 · **evidência baixa**". Desempenho: "Evidência: **Baixa**" para a mesma Analytics. São escopos diferentes (índice × leitura × tópico), mas os três rótulos usam a mesma palavra.

### D12 · P2 · Contagem de tópicos por disciplina: Disciplinas × Diagnóstico
Língua Portuguesa **18** × **17**; Tecnologia e IA **13** × **12**; Matemática Financeira **14** × **12**. O total de 305 fecha em Disciplinas, e o Diagnóstico cita "305 tópicos · 297 itens · 298 com sinal · 232 sem registro". Sem a regra de exclusão visível, o analista concluirá que há tópicos perdidos.

### D13 · P2 · Formatação numérica
`1.750` (Questões) × `1750` (Visão geral). Percentuais como `72,0%` (zero decimal falso em "75/104 (72,0%)", quando 75/104 = 72,1%), `55%`, `55,0%`, `85%` na tabela do histórico. `68,0%` no gráfico × `68,3%` no texto da mesma tela (316/463 = 68,25%).

### D14 · P2 · Meta diária
Vazio: "Meta diária **2h30**", "0 / **21** questões" (sem plano nem disponibilidade, "—"). Demo: "Meta diária **2h00**", "0 / **31**". E em Hoje: "TEMPO ESTUDADO HOJE 0min de **2h** · 0%" ao lado de "0 min de **1 h 20 min** do plano · 0%". Dois denominadores para o mesmo dia.

No vazio, a meta de 2h30 e as 21 questões aparecem sem que o usuário tenha informado nada. Parecem padrões embutidos, mas o texto diz "Plano diário ainda não montado".

### D15 · P3 · Resgate × saldo
"Resgatar em **30 min**" para um saldo de "**6 min** a redistribuir". Em Fechamento: "Replanejamento indisponível: sem capacidade", enquanto Semana e Hoje oferecem "Redistribuir saldo pendente" duas vezes.

### D16 · P3 · Conquista × histórico
Conquista "Resultado positivo medido depois de uma recomendação" está desbloqueada. Planejamento › Histórico: "11 lacunas trabalhadas; **0 com resultado posterior medido**". Pode ser janela diferente, mas a tela não diz isso.

### D17 · P3 · "Iniciar revisão" em tópicos sem registro (não corrigido)
Diagnóstico: tópicos com lacuna de **cobertura 100/100** (ex.: Cartão de crédito, Capitalização) mostram "**Iniciar revisão**". O rótulo vem do tipo que o motor de recomendação devolve (`studyType: review`), não de um defeito do botão. Provável origem: a demo marca tópicos como "Em revisão" sem sessões nem questões. Precisa investigar o gerador antes de mexer no rótulo.

### D18 · P3 · Streak × últimos 7 dias
Cabeçalho "**7 dias** em sequência" × Resumo "estudou em **6 dias**" nos últimos 7. A sequência provavelmente termina ontem, mas a regra não está visível.

---

## 3. Redundâncias e repetições

### R1 · "9 atrasadas" em 8 pontos
Visão geral (Atenção · Tarefas e revisões · "9 pendências atrasadas"), Hoje (Atenção · Revisões para regularizar · Replanejamento), Agenda (Status), Questões (KPI "9 pendências atrasadas · hoje"). A aba Questões não é lugar de pendências de revisão.

### R2 · A mesma sugestão Analytics em 5 telas
Visão geral (Próxima ação + Leitura do Extrato), Hoje › Estratégia (cartão completo), Desempenho › Resumo (O que fazer), Diagnóstico (topo). Cada uma repete o "Por quê?" com os mesmos três motivos.

### R3 · Ciclo de Estudos duplicado
Hoje › Ciclo de Estudos e Planejamento › Central do Ciclo mostram o mesmo bloco: "39 h · prévia", "3 h · 8%" para as mesmas 4 disciplinas, "Mostrar todas as 17 disciplinas". Dois CTAs diferentes ("Ativar ciclo recomendado" e "Confirmar nova versão do ciclo") para a mesma ação.

### R4 · Disponibilidade/livre do dia 3 vezes
Hoje: "Tempo flexível 40 min" · "Livre 40 min" · "Livre 40 min (33%)", e "0%" de execução em 5 lugares.

### R5 · Empty states empilhados
Agenda sem dados: 7 mensagens "Nenhum…/Nada…" na mesma página, mais "Adicionar atividade" duas vezes. Desempenho sem dados: "Ainda não há evidência…", "Ainda não há dados suficientes…", "Nenhum ponto de atenção com evidência suficiente.", "Ainda não há pontos de atenção com evidência suficiente para destacar." (as duas últimas são quase idênticas e vizinhas), mais "Sem simulados…", "Sem tempo planejado…", "Sem plano ativo…".

### R6 · Onboarding e demo
Na primeira visita a busca por "Explorar demonstração" achou 5 correspondências no DOM (4 botões e 1 texto interno): modal, cartão de boas-vindas, banner "Veja o Extrato funcionando" e rodapé. O banner aparece em todas as abas. A modal diz "plano guiado… 4 passos"; o cartão diz "Montar meu plano de estudos"; Planejamento diz "3 passos"; Instruções lista 6 passos duas vezes ("Como funciona" e "Primeiros passos"). Rótulos diferentes (guiado/plano de estudos), contagens diferentes (4/3/6).

### R7 · Atalhos de navegação duplicados
Rodapé "Instruções e dúvidas"/"Buscar no app"/"Explorar demonstração" repetem a aba Instruções, o botão Buscar e o CTA de demo. No vazio, o rodapé ocupa metade da altura da página.

### R8 · Conteúdo repetido em "Instruções"
Cada seção repete "Iniciante · 1 min de leitura", "Copiar link" e "Esta explicação foi útil? Sim/Não". "Comece por aqui" é ao mesmo tempo chip de navegação e título de seção.

### R9 · Questões
"Registrar sessão" ×2, "Registrar simulado" ×2, "Importar" + "Importar arquivo CSV de questões".

### R10 · Desempenho × Questões & Simulados
A subaba "Resultados das provas" contém "Questões respondidas" (que não são provas) e a aba principal "Questões & Simulados" mostra os mesmos 68,3%, 463, perfil de erros etc. Mesmo conteúdo em dois níveis.

---

## 4. Vocabulário e navegação inconsistentes

- **Revisão × Tarefa:** o item "Revisão rápida" é uma *tarefa de estudo* (botão "Concluir tarefa"), mas Hoje o classifica como "REVISÃO"; a Agenda filtra tarefas com "Todos os tipos de revisão". "Revisão 24h/7d/30d" é a revisão espaçada. Nos dois casos a palavra é "Revisão".
- **Nomes de aba:** desktop "Planejamento"/"Questões & Simulados"; a navegação inferior do DOM usa "Planos"/"Questões" (grupo oculto no desktop, com ordem Hoje, Visão geral, Desempenho, Questões, Agenda, Planos). No mobile visível, a barra mostra Visão, Desempenho, Hoje, Agenda, Mais. Não abri "Mais" para ver o que há dentro.
- **"Tenho X minutos"** (Hoje) usa "X" literal como placeholder; já a Visão geral tem "Tenho 30 minutos".
- **"Pendência", "atrasada", "vencida", "pendente"** descrevem o mesmo estado.
- **Rótulos de KPI:** "SIMULADOS COMPARÁVEIS · ESTIMATIVA · ABRIR" e "PENDÊNCIAS ATRASADAS · HOJE" acumulam 2 a 3 qualificadores sem hierarquia.

---

## 5. Primeira visita (sem dados)

**O que funciona:** modal com 3 caminhos claros, cartão único na Visão geral, estados vazios que dizem o motivo ("Sem plano ativo: registre um plano para medir o ritmo"), copy sóbria e honesta sobre evidência.

**Problemas:**
- **V1 · P1:** o usuário vê o cartão de boas-vindas, o modal, o banner da demo e o rodapé, todos com chamadas concorrentes. A tarefa principal ("monte seu plano") compete com "Explorar demonstração" em cada um.
- **V2 · P1:** todas as abas continuam navegáveis sem dados e repetem mensagens de "sem evidência" (ver R5). O Hoje vazio mostra metas e 0/21 questões que ninguém configurou.
- **V3 · P2:** cabeçalho "PRONTIDÃO —", "Nº do plano 2026-001" e a data de hoje sem concurso, sem contexto para alguém que nunca viu o produto.
- **V4 · P2:** rodapé domina a tela quando a página tem 1 cartão.

---

## 6. Demonstração

- Dados com padrão sintético evidente: **toda** sessão de questões tem exatamente 20 questões; 4 semanas seguidas com "7 h de 10 h planejados"; revisões em ciclo 24h/7d/30d dia após dia; as 5 linhas de "Aderência nos fechamentos salvos" dizem o mesmo ("Carga parcialmente executada · versão 1"). Um analista percebe em 2 minutos que são dados gerados, o que diminui a credibilidade dos diagnósticos que a demo deveria vender.
- O banner "Dados fictícios" é claro e bem usado, mas "Reiniciar demo", "Tour guiado" e "Sair" ficam no mesmo bloco do banner no desktop e viram um menu "Opções" no mobile.
- Conquistas "Desbloqueada **antes de** 20/11/2026" é uma data vaga para um dado que a demo controla.

---

## 7. Mobile (375 × 812)

- Sem rolagem horizontal; nenhum alvo de toque menor que 32 px (33 interativos visíveis). Bom.
- O cabeçalho (banner da demo, título, prontidão, data da prova, fase, barra) ocupa **quase a tela inteira** antes de "Próxima ação"; os botões Dados/Preferências/Tema ainda empurram o conteúdo.
- O menu de Preferências abre como popover sobre o conteúdo e permanece aberto ao navegar.
- A Visão geral tem ~5.400 px de altura.

---

## 8. Pontos fortes (para preservar)

1. **Honestidade sobre evidência:** "Evidência: Baixa", "Amostra pequena", "não é chance de aprovação". Mantenha.
2. **Aritmética interna confiável:** totais, deltas e perfil de erros fecham (11 h 56 − 6 h 29 = +5 h 27; 147 erros = 463 − 316).
3. **Contrato de mutação:** "Nada é salvo… sem a sua confirmação" aparece de forma consistente.
4. Layout a 375 px sem estouro, alvos de toque adequados, regiões e abas com `aria` (aferido por leitura de texto/roles; sem axe).

---

## 9. Personas

**Alex (power user, analítico).** Abre Visão geral → Desempenho → Diagnóstico. Vê "Próxima ação: LP" e depois "Próxima ação: Analytics". Compara 71,1% com 85,0% em Produtos e Serviços e para de confiar. Os atalhos (Alt+1–5, Ctrl+K) existem e ajudam, mas não resolvem a dúvida de qual número é o certo. Perda de confiança em 5 minutos.

**Sam (teclado e leitor de tela).** Os 9 "atrasadas" repetidos em 8 pontos são 8 anúncios iguais. "Tenho X minutos" é lido literalmente. KPIs com 3 qualificadores ("SIMULADOS COMPARÁVEIS · ESTIMATIVA · ABRIR") soam como ruído. Os textos longos de empty state aumentam a leitura linear.

**Jordan (primeira vez).** Vê 5 convites para demo e 3 caminhos de plano (guiado/manual/colar edital), com 4, 3 ou 6 passos conforme a tela. "Prontidão", "Domínio", "Retenção", "Aderência" aparecem antes de qualquer definição (a definição está em Instruções, uma aba que ele precisa achar).

**Riley (stress).** O Hoje sem dados mostra 0/21 questões e meta de 2h30 que ninguém definiu. "Resgatar em 30 min" para 6 min. "Iniciar revisão" em tópicos nunca estudados. 68,0% × 68,3% na mesma tela. Fecha o app achando que os números são aproximados.

**Casey (mobile).** Precisa rolar quase uma tela inteira só para ver "Próxima ação". Pouco tempo e muita repetição do mesmo bloco numa página de ~5.400 px.

**Concurseira com a prova em 90 dias (persona do PRODUCT.md).** O objetivo declarado é "saber a próxima ação sem esforço". Hoje ela recebe cinco.

---

## 10. Nielsen (0–4)

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | Bom feedback ("Salvo", "prévia"); falta explicar janelas |
| 2 | Linguagem do usuário | 3 | Jargão definido em Instruções, não onde aparece; "Tenho X minutos" |
| 3 | Controle e liberdade | 3 | Prévias e confirmações; "Dispensar 7 dias" |
| 4 | Consistência e padrões | **1** | D1–D13, vocabulário Revisão/Tarefa, formatos de % |
| 5 | Prevenção de erros | 3 | Prévia antes de gravar |
| 6 | Reconhecimento | 3 | Nomes de aba divergem entre navegação desktop e inferior |
| 7 | Flexibilidade | 3 | Atalhos e busca; sem ação em lote visível |
| 8 | Estética minimalista | **2** | R1–R10; o mesmo bloco em 5 telas |
| 9 | Recuperação de erros | 3 | Estados vazios claros |
| 10 | Ajuda | 3 | Central rica, mas repetitiva (R8) |
| | **Total** | **27/40** | Aceitável: os pontos fracos são Consistência e Minimalismo |

---

## 11. Ações recomendadas (ordem de impacto)

1. **Fonte única de "próxima ação" e de "prioridade"** (D1, D2). Um objeto `{plano, sugestão, foco_semana}` com rótulos fixos, consumido por Visão geral, Hoje, Desempenho e Fechamento. Corrigir "Classes de palavras" (85%) como lacuna.
2. **Um contador de pendências** (D3, R1). Mostrar "7 revisões + 2 tarefas" em todo lugar; mostrar o card completo em um só (Hoje) e um link nos demais.
3. **Rótulo de janela em todo número de acerto/aderência** (D4–D10, D13). "4 sem", "30 d", "7 d" ao lado de cada percentual; uma regra de arredondamento (1 casa decimal sempre); reconciliar 68,0% × 68,3%, 72,0% × 72,1% e 84,0% × 83,8%. Corrigir "6 semanas completas".
4. **Definição única de "abaixo da meta"** (D5) e de contagem de tópicos por disciplina (D12).
5. **Consolidar Ciclo de Estudos** (R3): Hoje mostra só a próxima volta e linka para a Central.
6. **Uma única entrada de demo na primeira visita** (R6, V1): modal ou cartão, não os dois mais o banner e o rodapé. Alinhar o número de passos (4) em todas as telas.
7. **Vocabulário:** reservar "Revisão" para revisão espaçada e "Tarefa de estudo" para tarefas; alinhar nomes de aba entre desktop e mobile; trocar "Tenho X minutos".
8. **Empty states** (R5): uma mensagem por página, com um único CTA; no vazio, esconder metas/denominadores que o usuário não definiu (D14).
9. **Demo mais irregular** (seção 6): variar o número de questões por sessão e a execução semanal.
10. **Mobile:** compactar o cabeçalho (prontidão e data da prova em uma linha) para a "Próxima ação" aparecer sem rolagem.

Comandos Impeccable sugeridos: `/impeccable distill` (R1–R5, R10), `/impeccable clarify` (D13, vocabulário, "Iniciar revisão"), `/impeccable layout` (mobile, cabeçalho), `/impeccable onboard` (R6, V1–V4), `/impeccable polish` por último.

---

## 12. O que não foi verificado

- Não rodei `impeccable detect`, axe, Lighthouse nem testes E2E.
- Não testei fluxos de escrita (registrar sessão, importar edital, backup/WebDAV, cronômetro, Caderno de Erros em detalhe).
- Não abri Preferências/Dados, Busca (Ctrl+K), tour guiado, tema claro, nem a modal "Montar meu plano guiado".
- Não confirmei no código a causa de cada divergência. Várias podem ter regra legítima (janelas diferentes); o problema é a falta de rótulo, não necessariamente o cálculo.
- Contagens de ocorrências ("8 pontos", "5 telas") vêm de leitura de texto renderizado nas abas visitadas, não de busca exaustiva.

---

## 13. Implementado em 20/11/2026 (sem commit)

Validado com `npm run check:types`, `npm test` (1852 testes passando), `npm run build` e conferência na demo.

| Item | O que mudou |
|---|---|
| D1 (parcial) | Desempenho e Diagnóstico deixam de chamar a sugestão do diagnóstico de "Próxima ação" e de dizer que ela "vem do plano de hoje". Textos em `build-week-summary.ts`, `consolidated-diagnosis-renderer.ts`, `PreparationReadingView.tsx`. A origem do cálculo continua em dois motores (plano × diagnóstico). |
| D3 | A Desempenho passa a receber o mesmo contador de pendências da Visão geral e da Agenda (`overdueCount` → `revisoesAtrasadas`). Vocabulário unificado em "pendências atrasadas (revisões e tarefas)"; o Diagnóstico diz "7 revisões vencidas" explicitamente. Resultado na demo: 9 em Visão geral, Hoje, Desempenho; 7 só onde o texto diz "revisões". |
| D7 | O rótulo "6 semanas completas" sob os KPIs virou "tendência: 6 semanas completas". O número do KPI já era do período filtrado; o rótulo é da sparkline. Minha leitura anterior ("rótulo errado") estava incompleta. |
| D13 (parcial) | Acerto agregado por disciplina e total em Questões passa a ter uma casa decimal (72,1% e 68,3% em vez de 72,0% e 68,0%). |

**Não implementado** (precisa de decisão de produto ou investigação da demo): D2 (cinco prioridades, hoje dois motores), D4/D5/D6/D8–D12, D14–D16, D18 (janelas e critérios diferentes: exigem rótulo de janela e critério único por tela), D17 (acima), R1–R10, vocabulário Revisão × Tarefa, "Tenho X minutos" (é o nome da função "Estudo rápido", documentado na ajuda; mantive), onboarding (R6), demo mais irregular, cabeçalho mobile.

Esses pontos coincidem em grande parte com o plano já decidido em [tasks/analise-desempenho-enxugar.md](../../tasks/analise-desempenho-enxugar.md) (Fases 1–3, T2/T3), que é o lugar natural para continuá-los.
