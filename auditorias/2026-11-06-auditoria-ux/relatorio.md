# Auditoria de UX/UI — Extrato Estudos

**Data:** 6 de novembro de 2026  
**Site:** https://extratoestudos.com.br/  
**Escopo:** percurso de iniciante em desktop (1280 px) e mobile (390 px; verificação adicional a 320 px). Teste exploratório com dados de teste.

## Prancha de achados anotados

![Capturas anotadas: seleção inicial do edital e calendário mobile](capturas-anotadas.svg)

[Abrir prancha SVG em tamanho original](capturas-anotadas.svg)

## Resumo

A interface tem identidade visual própria e consistente: fundo claro com textura discreta, verde escuro como superfície de destaque, acentos verdes suaves, títulos serifados e rótulos compactos. A versão móvel reorganiza a navegação para uma barra inferior e não apresentou overflow horizontal da página nem em 320 px.

Os pontos de maior impacto observados são: o importador de edital inicia com todos os 230 tópicos selecionados; o calendário mensal da agenda fica parcialmente fora da tela em celular, sem uma pista explícita de deslize; e planejamento/desempenho concentram muitas seções em páginas longas, o que aumenta o custo de leitura para quem está começando. A divisão entre revisões de flashcards e revisões da agenda também exige que a pessoa entenda dois fluxos.

## Percurso de iniciante e evidências

1. **Entrada e onboarding:** a página de apresentação ocupa a primeira tela; foi necessário escolher “Abrir Aplicativo”. O onboarding tem quatro passos: objetivo, rotina, edital e confirmação do plano. O resumo antes de confirmar torna visível a consequência da importação e da criação do plano.
2. **Edital e matérias:** escolhi Banco do Brasil — Escriturário. O seletor apresentou 230/230 tópicos marcados. Para limitar o teste, limpei a seleção e marquei apenas Língua Portuguesa (18 tópicos); a prévia explicitou o que seria criado. Depois, em Matérias, criei “Matéria de teste UX” e “Tópico de teste”.
3. **Planejamento:** confirmei a rotina de 14 h/semana e o plano sugerido. A tela mostra capacidade, alocação e execução, mas há bastante conteúdo vertical e detalhes distribuídos por seções expansíveis.
4. **Cronômetro:** iniciei a primeira atividade pela tela Hoje, pausei o timer, finalizei a sessão e registrei 5 minutos, 5 questões e 4 acertos. O fluxo de confirmação deixa claro que os dados entram no histórico ao salvar.
5. **Questões e revisão:** Questões refletiu 5 respostas e 80% de acerto. No Caderno de Erros, transformei o erro em flashcard, revelei a resposta e avaliei como “Bom”; o cartão foi agendado para quatro dias. Em Agenda, cadastrei uma revisão manual para 7/11/2026.
6. **Relatórios:** Desempenho mostrou métricas iniciais e explicou que ainda faltam dados para projeção. A explicação de insuficiência é útil, mas está inserida numa página bastante extensa.

### Capturas comentadas — desktop

**A. Entrada e onboarding.** ① A apresentação antecede o aplicativo. ② O passo do edital seleciona uma carga grande por padrão. ③ A prévia de importação/planejamento é uma boa confirmação antes de persistir.

![Entrada inicial](screenshots/extrato-desktop-inicial.png)

![Onboarding — objetivo](screenshots/extrato-onboarding-etapa1-desktop.png)

![Onboarding — rotina](screenshots/extrato-onboarding-etapa2-desktop.png)

![Onboarding — edital](screenshots/extrato-onboarding-etapa3-desktop.png)

![Edital completo selecionado](screenshots/extrato-selecao-edital-desktop.png)

![Seleção reduzida para Língua Portuguesa](screenshots/extrato-selecao-edital-portugues.png)

![Prévia antes de criar o plano](screenshots/extrato-onboarding-previa-plano-desktop.png)

**B. Uso diário e histórico.** ① Hoje é o ponto de entrada mais direto para iniciar a atividade. ② A finalização abre confirmação explícita. ③ Questões e Caderno de Erros tornam os dados de teste rastreáveis. ④ O cartão permite revelar e avaliar a resposta.

![Hoje](screenshots/extrato-hoje-desktop.png)

![Confirmação de sessão](screenshots/extrato-sessao-confirmar-desktop.png)

![Sessão salva](screenshots/extrato-hoje-sessao-salva.png)

![Questões](screenshots/extrato-questoes-desktop.png)

![Caderno de erros](screenshots/extrato-caderno-erros-desktop.png)

![Criação de flashcard](screenshots/extrato-novo-flashcard-desktop.png)

![Revisão do flashcard](screenshots/extrato-revisao-flashcard-desktop.png)

![Resposta revelada e avaliação](screenshots/extrato-revisao-resposta-revelada.png)

**C. Agenda, disciplinas, planejamento e relatório.** ① Agenda tem calendário e lista. ② As disciplinas mostram progresso por tópicos. ③ O planejamento e o desempenho são páginas longas; o recorte abaixo registra sua primeira visão e a captura completa permite inspecionar a extensão.

![Agenda](screenshots/extrato-agenda-desktop.png)

![Agenda com revisão criada](screenshots/extrato-agenda-com-revisao.png)

![Disciplinas](screenshots/extrato-disciplinas-desktop.png)

![Matéria e tópico de teste](screenshots/extrato-disciplina-materia-teste.png)

![Desempenho — página completa](screenshots/extrato-desempenho-overview.png)

### Capturas comentadas — mobile

**390 px.** ① Barra inferior preserva os destinos principais; “Mais” agrupa Desempenho, Questões e Simulados, Planejamento e Instruções. ② No calendário mensal, só parte dos dias da semana cabe no primeiro quadro; é preciso deslizar horizontalmente ou mudar para Lista. ③ Lista é uma alternativa mais legível em tela estreita.

![Hoje no celular](screenshots/extrato-hoje-mobile.png)

![Questões no celular](screenshots/extrato-questoes-mobile.png)

![Planejamento no celular](screenshots/extrato-planejamento-mobile.png)

![Agenda no celular](screenshots/extrato-agenda-mobile.png)

![Calendário mensal parcialmente visível](screenshots/extrato-agenda-mobile-calendario.png)

![Agenda em modo lista](screenshots/extrato-agenda-mobile-lista.png)

**320 px.** Verificação de largura: `document.documentElement.scrollWidth` e `body.scrollWidth` foram 320 px. O calendário ainda é uma faixa interna que demanda rolagem lateral.

![Agenda a 320 px](screenshots/extrato-agenda-mobile-320.png)

## Plano de melhorias priorizado

| Prioridade | Problema e reprodução | Recomendação específica |
|---|---|---|
| **P2 — onboarding e carga cognitiva** | No onboarding, escolher Banco do Brasil → carregar edital abre uma seleção com **230/230 tópicos marcados**. Uma pessoa pode importar carga muito maior do que imaginava; a tela exige perceber a contagem, limpar e selecionar manualmente. Existe uma prévia antes da confirmação, o que reduz mas não elimina o risco de sobrecarga. | Iniciar com nenhuma seleção ou perguntar “Importar edital inteiro ou escolher matérias?”. Manter contagem e impacto visíveis e oferecer “Selecionar todas” como ação deliberada. Se a seleção total for mantida, destacar a quantidade de tópicos junto ao botão de confirmação. |
| **P2 — mobile / navegação** | Em 390 px, Agenda → Calendário mostra apenas as primeiras colunas. As restantes exigem deslize horizontal não sinalizado; a grade tem largura maior que o contêiner. | Preferir agenda semanal/lista por padrão em telas estreitas ou adaptar a grade para caber. Se o scroll lateral continuar, mostrar indicador/gradiente e dica curta; manter Lista em posição imediatamente perceptível. |
| **P2 — carga cognitiva** | Planejamento e Desempenho ocupam várias telas de rolagem, com múltiplos resumos, indicadores e seções. Para o iniciante, a ação principal compete com informação secundária. | Começar cada tela com resumo curto e uma próxima ação; manter metas e status essenciais no topo; recolher detalhes analíticos por padrão e nomear as seções com benefício/decisão. Revisar repetição de métricas entre Hoje, Planejamento e Desempenho. |
| **P2 — modelo mental das revisões** | Depois de avaliar um flashcard como “Bom — 4 dias”, ele aparece no fluxo de revisão do Caderno; a revisão manual de tópico aparece em Agenda. São dois locais e duas lógicas de revisão. | Explicar a diferença na primeira utilização e criar um resumo comum “Próximas revisões” que encaminhe para flashcards ou revisões de tópico, sem esconder seus controles próprios. |
| **P3 — consistência de texto** | Com um erro registrado, o Caderno exibe “1 cards” (singular/plural inconsistente). | Usar pluralização localizada: “1 card” / “N cards”; revisar textos de contagem semelhantes nas telas de estado vazio e resumo. |
| **P3 — rastreabilidade da matéria** | A tela de Disciplinas mostra 10 dos 18 tópicos e usa “Mostrar mais · +8”. A função existe, mas o iniciante pode interpretar que os demais não foram importados. | Explicitar “Mostrando 10 de 18” junto à ação e manter o total visível após expandir. |

## Análise visual

- **Hierarquia:** títulos grandes serifados dão personalidade e separam seções; rótulos pequenos em caixa alta ajudam a escanear cartões. Em páginas analíticas longas, a sucessão de blocos com destaque semelhante enfraquece a prioridade da próxima ação.
- **Cores:** paleta coerente de fundo claro, verde escuro e acentos claros; os estados de sucesso e o foco visual são consistentes. Esta auditoria não fez medição numérica de contraste WCAG.
- **Tipografia:** contraste entre display serifado e texto de interface funciona visualmente. Rótulos e microtexto devem ser verificados em zoom e telas pequenas, em especial dentro de cartões densos.
- **Espaçamento e componentes:** cards, bordas, raios e espaços são razoavelmente consistentes. A abundância de cartões e indicadores, principalmente em Planejamento/Desempenho, pode fazer todas as informações parecerem igualmente importantes.
- **Consistência entre formatos:** navegação muda de abas superiores em desktop para barra inferior e menu “Mais” no celular; a mudança é razoável, mas os destinos secundários ficam menos descobertos no mobile. A grade mensal não se adapta à largura como os demais elementos.

## Acessibilidade, responsividade e limites

A árvore de acessibilidade expôs nomes úteis para controles e campos em boa parte dos fluxos; também há estrutura de navegação e áreas identificáveis. Não foi realizada auditoria completa com leitor de tela, teclado em todos os fluxos, axe ou medição de contraste. Em 390 px e 320 px, a página não criou overflow horizontal global; a grade da agenda mantém overflow interno deliberado, mas sem indicação suficientemente visível.

Durante o carregamento foram observados erros de console ligados a um handler inline bloqueado por CSP e ao script externo Cloudflare Insights. Não percebi falha funcional associada durante os fluxos testados; fica como observação técnica de baixa prioridade, sem atribuir causa definitiva ao produto.

## Dados de teste e preservação

O estado inicial observado não tinha matérias nem atividade registrada. Para testar o percurso, criei “Matéria de teste UX” com “Tópico de teste”, importei apenas Língua Portuguesa (18 tópicos), confirmei um plano com prazo 31/03/2027, registrei uma sessão de teste (5 minutos; 4/5 acertos), criei um flashcard de teste e uma revisão para 07/11/2026. Não excluí registros. Esses dados permanecem no aplicativo neste navegador.

## Limitações

Teste exploratório manual, em uma sessão e com um conjunto pequeno de dados. Capturas são evidências do estado de teste em 06/11/2026. Não foram validados todos os editais, tamanhos/intermediários de viewport, leitores de tela, persistência após logout/dispositivo, nem a precisão pedagógica dos relatórios com histórico real.


