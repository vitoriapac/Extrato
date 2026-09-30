# Consolidação do ciclo estratégico

Os dez pacotes de consolidação pós-3.0 estão entregues. O ciclo liga evidências históricas da prova à prioridade, ao planejamento, à execução e à medição posterior, mantendo separados dados oficiais, ajustes manuais e inferências históricas.

## Jornada atual

Desempenho organiza a evolução em cinco visões: visão geral, questões, simulados, disciplinas e consistência. O comparador de disciplinas usa precisão observada, meta de acerto, distância da meta, evolução e prioridade calculada pelo motor existente. A navegação pode levar a disciplina e o concurso ativos ao Diagnóstico.

O Diagnóstico reúne os sinais de uma entidade em uma conclusão principal e conserva os demais como evidências auxiliares. A próxima melhor ação apresenta uma recomendação elegível já produzida pelo sistema; não cria outra ordenação de prioridades. A prévia de planejamento não grava mudanças. O usuário confirma o plano, executa a ação e pode inspecionar no fechamento a execução vinculada e os resultados posteriores. A confirmação respeita a capacidade semanal, e o histórico salvo permanece congelado.

A linha do tempo usa eventos existentes e permite filtrar categorias e agrupar por semana, mês ou fase registrada. Metas de acerto por disciplina herdam a meta global quando não personalizadas. Recuperação consistente e dívida de revisão acrescentam contexto ao diagnóstico, sem alterar automaticamente horas ou prioridades.

## Leitura dos indicadores

- O foco estratégico semanal é a parcela do tempo registrado em tópicos de alto impacto. É descritivo e não possui meta mínima.
- Lacunas trabalhadas dependem de sessão no tópico. Melhorou, ficou estável ou piorou somente quando há resultado posterior medido no mesmo período; sem essa medição, o estado continua desconhecido.
- O histórico compara apenas fechamentos salvos com métricas completas, períodos sem sobreposição e o mesmo concurso ativo. Snapshots antigos sem escopo conhecido não são usados como base de comparação.
- O PDF mostra os últimos sete dias do período escolhido e reutiliza a regra de foco semanal. Seu resumo não interpreta associação como causa e não inclui a matriz histórica inteira.
- A linha de tendência do foco usa apenas os percentuais dos períodos já selecionados pelo histórico. A lista textual informa datas, percentuais e minutos, inclusive quando o gráfico não aparece por falta de comparação.
- Conquistas estratégicas indicam o progresso e o impedimento do desbloqueio, sem alterar as regras da prioridade.

## Fronteiras do código

O domínio define limites e cálculo de impacto. A aplicação monta o fechamento, o histórico e o resumo semanal do PDF. Renderers recebem os modelos prontos. `src/ui/controllers/report-controller.js` cuida dos eventos e da impressão; `src/app.js` fornece as dependências e conecta o fluxo. A extração é incremental para preservar os outros controladores já estabilizados.

## Gate de publicação

Execute `npm run build` e `npm run check:all`. O gate valida sintaxe, testes unitários, artefatos gerados e Playwright, incluindo backup, acessibilidade, responsividade e regressão visual. O CI executa a suíte em UTC e `America/Sao_Paulo` e condiciona a publicação ao resultado. O hero e outros componentes estáveis usam capturas; o fechamento e o foco usam verificações de ordem, conteúdo e largura para acompanhar a composição editorial em Windows e Linux.
