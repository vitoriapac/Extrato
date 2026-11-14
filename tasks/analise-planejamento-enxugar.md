# Análise da aba Planejamento: o que enxugar e como torná-la coerente

Data: 14/11/2026. Fontes: leitura do app rodando (perfil vazio e demonstração, 5 subabas, com todas as dobras abertas) e as críticas do impeccable em `.impeccable/critique/` de 08/11, 11/11 (a completa, 19/40), 12/11 (26,5/40) e 13/11 (duas), incluindo personas e observações menores.

Limite desta análise: o painel do navegador estava oculto, então não medi alturas nem celular. As alturas citadas vêm das críticas. Leitor de tela e teclado não foram retestados.

**Nota de 14/11, depois da Tarefa 4:** a demonstração mudou às 08:15 (commit `c4b8561`, da sessão da Desempenho, que criou planos para os dias sem plano). Os números da demo citados abaixo ("2h40 com tarefa marcada", "10h23 estudadas e 0% de aderência", "0min vinculado") eram da demo anterior; hoje ela mostra 13h30 com tarefa marcada, 10h23 estudadas e 72% de execução das prioridades. O problema de fundo continua valendo para quem usa o app de verdade: quem estuda sem vincular as sessões a tarefas lê 0%. Os valores de "Distribuir" (2h20 e 12h10 sem espaço) foram medidos já na demo nova.

## 1. Resposta curta

A aba tenta fazer quatro trabalhos ao mesmo tempo: **configurar** (prova, metas, disponibilidade), **planejar** (proposta, distribuição), **acompanhar** (resumo, aderência, ritmo) e **auditar** (retratos, decisões, prioridades). Os dois últimos são análise, e a maior parte deles já tem dono em Desempenho.

O excesso tem três causas, em ordem de peso:

1. **As 17 disciplinas aparecem em 6 listas**, cada uma com ordem diferente.
2. **A mesma semana é descrita com números diferentes** em cada subaba.
3. **Conteúdo de análise mora aqui** sem necessidade.

Proposta: passar de 5 para 4 subabas (Semana · Prova e metas · Fechamento · Histórico), com uma única tabela por disciplina e um único vocabulário para o tempo da semana.

## 2. O que já foi resolvido desde a crítica de 11/11

Não precisa voltar a estes pontos:

- Subabas agora são `role="tabpanel"` de verdade (antes eram `<details>`).
- Enums em inglês da Matriz foram traduzidos (Não iniciado, Sem evidência, Frágil).
- Estado vazio abre com **Definir data da prova** como ação principal.
- Metas de acerto e de questões viraram uma tabela só.
- **Simular "E se?"** existe dentro do Planejamento.

## 3. Inventário por subaba (demonstração)

| Subaba | Dobras | Controles | Blocos |
|---|---|---|---|
| Plano da semana | 10 | 29 | Plano confirmado, distribuição por disciplina, tipo de estudo, estratégia por fase, histórico de adaptações, resumo da semana, execução das prioridades, planejado × realizado, cumprimento em 8 semanas, distribuição entre disciplinas, plano × impacto, metas ativas, disponibilidade, comparação entre períodos |
| Prova e ritmo | 35 | 148 | Régua de fases, opções gerais, configuração por disciplina (17 dobras), Matriz Edital × Domínio (17 dobras), estimativa de ritmo |
| Metas por disciplina | 18 | 126 | Tabela de metas (17 dobras), histórico de metas de 8 semanas |
| Fechamento semanal | 9 | 7 | A semana, análise completa, o retrato, a decisão |
| Histórico | 112 | 34 | Foco estratégico, aderência nos fechamentos, histórico de decisões, linha do tempo, comparação por fase, evolução das prioridades |

## 4. Divergências e incoerências (com evidência)

### 4.1 "Planejado" tem cinco valores para a mesma semana

| Onde | Rótulo | Valor |
|---|---|---|
| Semana › Plano confirmado | por semana / capacidade alocada | 12h |
| Semana › Resumo | Com tarefa marcada (semana inteira) | 2h40 |
| Semana › Execução das prioridades | prioritárias planejadas | 1h30 |
| Semana › Distribuição entre disciplinas | em planos diários (até hoje) | 1h20 |
| Fechamento › A semana | PLANEJADO (até hoje) | 1h20 |
| Histórico › Foco estratégico | planejados (período atual) | 2h40 |
| Semana › Cumprimento, semanas passadas | planejados | 10h00 |

Cada número é correto na sua definição, mas o rótulo é quase sempre "planejado". É o P1 das críticas de 08/11, 12/11 e 13/11 e continua aberto.

### 4.2 Colunas invertidas em "Distribuição entre disciplinas"

O cabeçalho diz **Planejado | Realizado**, mas o valor é exibido como realizado / planejado: Língua Portuguesa aparece `2h 12m / 45m` com os tooltips "Planejado: 45m" e "Realizado: 2h 12m". Disciplinas estudadas sem plano recebem o selo "Extra"; Língua Inglesa, planejada e não estudada, aparece `0m / 35m`. Isto é um defeito, não questão de gosto.

### 4.3 Meta de questões: três números

- Semana › Metas ativas: **80 / 220** questões na semana.
- Metas por disciplina: "sem meta global de questões: vale a soma das disciplinas", soma **1.190**.
- Histórico de metas: usa **220**.

A tela afirma que não há meta global e mostra uma meta global. Aberto desde 11/11.

### 4.4 Meta de acerto por disciplina editável em dois lugares

- Prova e ritmo › Configuração por disciplina › campo "Meta de acerto (%)".
- Metas por disciplina › "Meta de acerto (%)" + "Salvar acerto".

Além disso há três percentuais-alvo com nomes próximos: **Nota-alvo**, **Meta geral de domínio** e **Meta de acerto**. Para um iniciante são a mesma coisa; a tela só avisa em caixa alta "separada da meta de domínio".

### 4.5 Metas que não conversam com o ritmo

- Estimativa de ritmo: 2 tópicos/semana realizados, **15,1** necessários.
- Metas ativas: meta de **12** tópicos/semana e 48/mês.

A meta não atinge o necessário e está seis vezes acima do real, sem aviso. Mesma lógica para dias: Disponibilidade diz "7 dias com estudo", a meta de rotina diz "5 dias".

### 4.6 O plano confirmado não é o plano medido

O plano confirmado distribui 12h entre 17 disciplinas. Só 2h40 viraram tarefa. A execução é medida contra as 2h40, e "Plano × impacto na prova" analisa só 2 disciplinas (56% e 44%) como se fossem o plano inteiro. Resultado na demo: 10h23 estudadas, **0% de aderência**, e a frase "Você estudou 3,9× o tempo com tarefa marcada". O estudante que estudou muito lê que falhou.

### 4.7 Texto de prévia em plano já confirmado

"carga de 720 min e capacidade de 720 min preservadas", "3 divisões de atividades propostas", "Revisar proposta de estratégia" aparecem abaixo de "Plano confirmado". Apontado em 11/11, continua.

### 4.8 Sete formatos de tempo

`12h` · `1h 20m` · `2h40` · `6h 59min` · `720 min` · `0min` · `0h00`. Na mesma subaba.

### 4.9 Seis verbos para montar o plano

Distribuir nos próximos 7 dias · Calcular proposta semanal · Simular "E se?" · Revisar proposta de estratégia · Montar planejamento · Conferir impacto. Jordan (persona iniciante) "pode confundir distribuição, proposta e simulação" (crítica de 13/11). O botão "Ver resumo da semana" só rola a página.

### 4.10 Comparação de período parcial com período fechado

Histórico compara a semana em andamento ("10h 23min de 2h 40min planejados") com semanas fechadas ("7h de 10h") e calcula variação entre elas. Observação menor de 12/11, continua.

### 4.11 Dois modelos de salvamento

Metas ativas e disponibilidade salvam ao sair do campo. Metas por disciplina têm "Salvar acerto" e "Salvar questões" separados por linha; configuração por disciplina tem "Salvar / Cancelar". Alex (persona avançada) tropeça nisso desde 08/11.

## 5. Repetições

| Conteúdo | Onde aparece | Quantas vezes |
|---|---|---|
| Lista das 17 disciplinas | Plano confirmado, distribuição entre disciplinas, plano × impacto, configuração por disciplina, Matriz, metas por disciplina | 6, cada uma em ordem diferente |
| Leitura da semana atual | Resumo da semana, Fechamento › A semana, Histórico › período atual | 3, com números diferentes |
| Série semanal histórica | Cumprimento nas semanas concluídas (Semana), Histórico de metas (Metas), Aderência nos fechamentos e Foco estratégico (Histórico) | 4 em 3 subabas |
| Fases da preparação | Estratégia por fase (Semana), régua de fases (Prova), comparação por fase (Histórico) | 3 |
| Sustentabilidade, composição do tempo, crédito da execução | Fechamento e dentro de cada retrato salvo | 1 + N (esperado nos retratos, mas são 112 dobras) |
| Explicações de método | "Como esta métrica é calculada", "Sobre o alinhamento", "Como interpretamos estas semanas?" e notas fixas | cerca de 8 |

## 6. Utilidade por perfil

Legenda: ● essencial · ○ útil às vezes · — não usa.

| Bloco | Iniciante | Avançado | Veredito |
|---|---|---|---|
| Data da prova e régua de fases | ● | ● | Manter |
| Disponibilidade semanal | ● | ● | Manter, subir para perto do plano |
| Plano confirmado + distribuir nos dias | ● | ● | Manter, uma ação principal |
| Resumo da semana (capacidade, agendado, estudado) | ● | ● | Manter, vira a única leitura da semana |
| Meta global de acerto, dias e questões | ● | ○ | Manter, reduzir a 3 metas |
| Meta de tópicos no mês | — | — | Cortar (é 4× a semanal) |
| Divisão por tipo de estudo | ○ | ● | Manter em uma linha |
| Estratégia por fase (proposta) | — | ○ | Só aparece quando há proposta nova |
| Execução das prioridades | — | ○ | Dobrar dentro do resumo |
| Planejado × realizado por dia | ○ | ● | Manter dobrado |
| Cumprimento nas semanas concluídas | — | ● | Mover para Histórico |
| Distribuição entre disciplinas | ○ | ● | Manter uma, corrigir colunas |
| Plano × impacto na prova | — | ○ | Mover para Desempenho |
| Comparação personalizada entre períodos | — | ○ | Mover para Desempenho (a própria nota manda para lá) |
| Configuração por disciplina (peso, prioridade) | — | ● | Fundir com metas por disciplina |
| Metas por disciplina | ○ | ● | Fundir, ver acima |
| Matriz Edital × Domínio | — | ● | Mover para Desempenho; é diagnóstico |
| Estimativa de ritmo | ● | ● | Manter, e ligar às metas |
| Histórico de metas, 8 semanas | — | ○ | Mover para Histórico |
| Fechamento: retrato e decisão | ○ | ● | Manter; "A semana" reutiliza o Resumo |
| Fechamento: análise completa (9 dobras) | — | ○ | Reduzir a uma dobra |
| Retratos semanais | ○ | ● | Manter em lista paginada |
| Histórico de decisões, linha do tempo, evolução das prioridades | — | ○ | Mover para Desempenho ou manter em uma dobra única |

O iniciante usa de fato sete blocos. O avançado usa quase tudo, mas sofre com a repetição e a falta de edição em lote, não com a falta de informação.

## 7. Plano para enxugar

Cada fase é entregável sozinha. A ordem vai do mais barato e mais visível para o mais estrutural.

### Fase 1: coerência de números e rótulos (sem mudar estrutura)

1. **Três medidas com nome fixo**, usadas em Semana, Fechamento e Histórico:
   - **Capacidade**: horas disponíveis na semana.
   - **Agendado**: tempo com tarefa marcada nos dias.
   - **Estudado**: tempo registrado.
   A palavra "planejado" sozinha deixa de aparecer. Onde houver recorte "até hoje", o rótulo diz.
2. Corrigir as colunas invertidas em Distribuição entre disciplinas (4.2).
3. Um formato de tempo: `2h40`, e `40min` abaixo de uma hora.
4. Meta de questões: uma regra só. A meta global é a fonte (decisão 3). As metas por disciplina passam a ser uma repartição da global: a tela mostra a soma ao lado da global e avisa quando não fecham; os padrões por disciplina são revistos para não somar 1.190 contra uma global de 220.
5. Plano confirmado sem texto de prévia (4.7).
6. Quando há estudo e 0% de aderência, a primeira linha explica: "10h23 estudadas, nenhuma ligada a tarefa agendada" e oferece agendar o restante do plano.
7. Renomear ações: **Agendar nos próximos 7 dias** (hoje Distribuir), **Recalcular plano** (hoje Calcular proposta), **Simular "E se?"**. Remover "Ver resumo da semana".

Aceite: nenhuma tela do Planejamento mostra "planejado" sem qualificador; a demo mostra um único total de questões; testes `planning.spec.js`, `adherence.spec.js` e `weekly-adherence.spec.js` atualizados e passando.

### Fase 2: cortar e mover

1. Para Desempenho: Comparação personalizada entre períodos, Plano × impacto na prova, Matriz Edital × Domínio. No lugar fica um link de uma linha.
2. Para Histórico: Cumprimento nas semanas concluídas, Histórico de metas, Histórico de adaptações.
3. Cortar: meta de tópicos no mês; a segunda lista de distribuição quando ainda não há estudo na semana.
4. Explicações de método: no máximo uma dobra "Como calculamos" por subaba, as demais viram link para Instruções.

Aceite: Plano da semana com no máximo 4 dobras; Prova com no máximo 2 fora da tabela de disciplinas.

### Fase 3: uma tabela por disciplina (Prova e ritmo + Metas por disciplina → "Prova e metas")

1. Uma tabela com as 17 disciplinas e as colunas: prioridade, peso, questões esperadas, meta de acerto, questões por semana, acerto atual.
2. Seleção em lote para todas as colunas editáveis (hoje só acerto e prioridade têm).
3. Um modelo de salvamento: salvar ao sair do campo, com o aviso "Salvo" e desfazer. Remover "Salvar acerto", "Salvar questões" e "Salvar / Cancelar" por linha.
4. Uma ordem de disciplinas, a do edital, com ordenação por coluna.
5. Nota-alvo, meta de domínio e meta de acerto: manter as três só no modo completo; no Essencial, um campo "Meta de acerto" que preenche as outras.
6. Estimativa de ritmo ao lado da meta de tópicos, com aviso quando a meta fica abaixo do necessário.

Aceite: meta de acerto por disciplina editável em um lugar só; ajustar as 17 disciplinas exige uma seleção e uma ação.

### Fase 4: Fechamento e Histórico

1. Fechamento › "A semana" usa o mesmo componente do Resumo da semana (`WeekReconciliationSummary`), com os mesmos números.
2. Análise completa do fechamento: uma dobra, não nove.
3. Histórico: retratos em lista de 5 com "mostrar mais"; detalhes de cada retrato só ao abrir.
4. Período em andamento não entra em variação contra períodos fechados (4.10).
5. Histórico vazio no modo Essencial mostra um texto de uma linha explicando o que aparecerá ali, não só o botão "Mostrar Retratos e histórico de decisões".
6. Decisões, linha do tempo e evolução das prioridades: ver decisão 2 abaixo.

Aceite: Histórico com menos de 20 dobras na demo (hoje 112).

## 8. Decisões tomadas (14/11/2026)

1. **Fechamento continua subaba própria.**
2. **Histórico de decisões, linha do tempo e evolução das prioridades:** antes de mover, analisar o que é útil para o estudante avançado; só o que passar nessa análise vai para Desempenho, o resto é cortado.
3. **Meta de questões: a global é a fonte.** A soma das metas por disciplina (1.190 na demo) precisa ser revista para fechar com a global (220): os valores padrão por disciplina estão altos e a tela não pode afirmar "sem meta global". Isto substitui o item 4 da Fase 1, que recomendava a soma.

4. **Ordem e escopo (após a crítica de 14/11):** começar pela Fase 1 (números coerentes) e seguir o plano inteiro, as quatro fases.
5. **Tratamento do 0%:** o tempo estudado vira o número principal; a aderência fica como segunda leitura, e a frase "estudar fora do plano não é perder tempo de estudo" sai da dobra.

## 8.1 Decisão 2: o que serve ao estudante avançado e vai para Desempenho

Critério: o bloco ajuda o avançado a decidir algo (mudar o plano, confiar ou não numa recomendação, ajustar a estratégia de fase)? Se só repete um número já mostrado, sai. Desempenho já tem "Calibração e auditoria das recomendações" (Recomendações · 30 dias e Resultados posteriores por tipo), que é o destino natural dos registros de recomendação.

| Bloco hoje em Planejamento | Uso real para o avançado | Destino |
|---|---|---|
| Histórico de decisões (Histórico) | Auditar se as recomendações funcionaram: o quê, por quê, acerto antes e resultado depois | Desempenho › Calibração e auditoria, como lista filtrável de 10 em 10 |
| Evolução das prioridades (Histórico) | Ver se uma lacuna fechou depois de virar prioridade | Desempenho › Calibração, resumida em tabela: lacuna, quando entrou, situação atual. Cortar os detalhes por decisão |
| Comparação por fase da preparação (Linha do tempo) | Comparar precisão, aderência e prontidão entre fases | Desempenho › Ritmo e aderência |
| Linha do tempo: lista de eventos | Pouco uso; repete decisões, simulados e retratos que já têm lugar próprio | Cortar |
| Plano × impacto na prova (Semana) | Conferir se o plano respeita o peso do edital | Desempenho › Inteligência da prova, comparando com o plano confirmado inteiro, não só com as tarefas marcadas |
| Matriz Edital × Domínio (Prova) | Ver lacunas por tópico | Desempenho › Diagnóstico |
| Comparação personalizada entre períodos (Semana) | Comparar datas livres | Desempenho, junto da comparação por período que já existe |
| Planejado × realizado por dia e Cumprimento nas semanas concluídas (Semana) | Ver o padrão semanal de execução | Desempenho › Ritmo e aderência |
| "Ver análise completa da semana" no Fechamento | Investigar a semana antes de salvar | Fica no Fechamento, reduzida a uma dobra; o que for série histórica vai para Desempenho |

Ficam em Planejamento, na subaba Histórico: os retratos semanais salvos e o histórico de metas (8 semanas), porque são registros do próprio plano.

Cuidado registrado em `docs/INFORMATION-OWNERSHIP.md`: decisões, linha do tempo e evolução das prioridades respondem a perguntas diferentes; não fundir sem mapear tipo, data, entidade e retrato de origem. Mover para a mesma seção é permitido; fundir os registros não.

## 8.2 O que a crítica impeccable de 14/11 acrescentou

- "Distribuir nos próximos 7 dias" propõe 5 dias, 2h20 no total e "12h10 sem espaço" contra um plano de 12h e 2h por dia útil. Pode ser defeito; investigar antes da Fase 1.
- Tempo prioritário com dois valores: 1h30 na Semana, 45 min no Fechamento. Excesso com dois formatos: "3,9×" e "778,8%".
- "Aderência" com cinco definições na aba (ao plano, estratégica, temporal, meta de aderência, por fase), mais "Cumprimento" e "Execução das prioridades".
- "Questões" por disciplina com dois sentidos: questões da prova ("18 questões · Peso 1") e meta semanal ("0/95 questões").
- Perfil vazio já mostra três concursos ativos e "Capacidade da semana 17h30" sem a pessoa ter informado nada.
- Axe: 0 violações em 40 combinações (5 subabas × vazio/demo × 1440/375 × claro/escuro); 55 verificações de contraste ficaram inconclusivas em Metas e pedem conferência manual.

## 9. Observações menores das críticas ainda abertas

- Botão principal pálido em Planejamento (13/11).
- "0%" em fonte grande sem explicação ao lado (12/11).
- Title Case em rótulos e nomes de subabas divergentes do `DESIGN.md` (12/11).
- "Em ajuste recente" como tendência, sem legenda (12/11).
- Jargão sem legenda: p.p., "Herdar domínio 80%" (08/11).
- Checkboxes de 13 px em telas de toque (11/11 e 12/11).
- Excluir meta com × sem desfazer (11/11). Não reverifiquei.
- No celular, trocar de subaba exige Mais → Planejamento → seletor (11/11 e 13/11). Não reverifiquei.
