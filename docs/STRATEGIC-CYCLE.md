# Consolidação do ciclo estratégico

Os dez pacotes de consolidação pós-3.0 estão entregues. O ciclo liga evidências históricas da prova à prioridade, ao planejamento, à execução e à medição posterior, mantendo separados dados oficiais, ajustes manuais e inferências históricas.

## Leitura dos indicadores

- O foco estratégico semanal é a parcela do tempo registrado em tópicos de alto impacto. É descritivo e não possui meta mínima.
- Lacunas trabalhadas dependem de sessão no tópico. Melhorou, ficou estável ou piorou somente quando há resultado posterior medido no mesmo período; sem essa medição, o estado continua desconhecido.
- O histórico compara apenas fechamentos salvos com métricas completas, períodos sem sobreposição e o mesmo concurso ativo. Snapshots antigos sem escopo conhecido não são usados como base de comparação.
- O PDF mostra os últimos sete dias do período escolhido e reutiliza a regra de foco semanal. Seu resumo não interpreta associação como causa e não inclui a matriz histórica inteira.
- Conquistas estratégicas indicam o progresso e o impedimento do desbloqueio, sem alterar as regras da prioridade.

## Fronteiras do código

O domínio define limites e cálculo de impacto. A aplicação monta o fechamento, o histórico e o resumo semanal do PDF. Renderers recebem os modelos prontos. `src/ui/controllers/report-controller.js` cuida dos eventos e da impressão; `src/app.js` fornece as dependências e conecta o fluxo. A extração é incremental para preservar os outros controladores já estabilizados.

## Gate de publicação

Execute `npm run build` e `npm run check:all`. O gate valida sintaxe, testes unitários, artefatos gerados e Playwright, incluindo backup, acessibilidade, responsividade e regressão visual. O CI executa a suíte em UTC e `America/Sao_Paulo` e condiciona a publicação ao resultado. As capturas do foco e do fechamento têm referências próprias para Windows e Linux quando a renderização difere.
