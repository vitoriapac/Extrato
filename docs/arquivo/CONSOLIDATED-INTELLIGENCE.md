# Inteligência consolidada

Este ciclo organiza os resultados dos motores existentes. Não cria um score composto, outro recomendador ou uma coleção persistida de diagnósticos.

## Pacotes

1. Estabilização completa, regressões, migração e navegação da demo.
2. Contratos dos sinais e vocabulário de apresentação.
3. Consolidação por entidade e precedência condicional.
4. Central de Diagnóstico 2.0.
5. Próxima melhor ação e confirmação segura.
6. Linha do Tempo Estratégica 2.0.
7. Evolução visual dos tópicos com snapshots congelados.
8. Metas de acerto em massa.
9. Auditoria visual e acessibilidade.
10. Simulação operacional de redistribuições.

## Pacote 1 — Estabilização

As recomendações apresentadas no diagnóstico precisam manter a mesma identidade entre renderizações, inclusive além das três primeiras. A identidade dos demais itens fica no cache da apresentação; o histórico mantém seu limite de três sugestões automáticas e registra outras ações quando o usuário as executa. Itens ocultos não são contados como apresentações. O cache verifica dia local, concurso, estado e assinatura das evidências, preservando também a explicação.

A migração de feedback legado sem `shownAt` utiliza a data original do registro para construir a explicação, sem depender do relógio atual ou de uma variável inexistente.

Na navegação, as análises estratégicas da Visão Geral são atualizadas ao abrir essa aba ou em uma renderização completa. As outras abas atualizam seus próprios módulos e o cabeçalho. Ações diretas do fechamento e seus filtros continuam atualizando suas análises explicitamente.

A auditoria de diagnóstico verifica o painel Hoje expandido; a estrutura global e os outros painéis possuem auditorias próprias. O caso mobile com duas auditorias completas tem um orçamento próprio de 120 segundos, mantendo as mesmas verificações de acessibilidade.

### Cobertura

O gate inclui unidades e artefatos gerados, E2E completo em UTC e America/Sao_Paulo, snapshots visuais, temas, viewports, schemas antigos, demonstração, modo offline, atualização do service worker e relatório de impressão. As regressões do ciclo estratégico percorrem concurso, evidência, prioridade, plano, sessão, resultado posterior, fechamento, prontidão e projeção. O relatório é validado em sua representação imprimível; a impressão depende do navegador.

Os testes de viewport/tema e de foco do cronômetro são casos independentes. Comparação de períodos e navegação pela busca também têm casos próprios. O paralelismo padrão usa dois workers, igual ao CI; as verificações não foram removidas.

As referências do diagnóstico usam um canvas fixo, com uma asserção prévia de que todo o conteúdo cabe nele. Isso evita divergência de altura por rasterização de fontes entre plataformas. As referências foram geradas no Windows; isso não constitui execução do CI Linux.

### Verificação do pacote 1

- `npm run check` e sintaxe: 440 testes unitários, artefatos reproduzíveis, UTC e America/Sao_Paulo.
- E2E completo em America/Sao_Paulo: 180/180.
- E2E completo em UTC antes da divisão do caso longo: 179/180; a comparação de períodos e a busca global atingiram o timeout conjunto. Os dois casos independentes passaram em UTC e America/Sao_Paulo (2/2 em cada fuso). Uma nova execução completa sobre os três pacotes encerrará o gate final.
- Regressão de sessão iniciada no diagnóstico, inclusive explicação e identidade da recomendação: passou. Referências visuais comuns do diagnóstico: 2/2 geradas e verificadas no Windows.

## Pacote 2 — Contrato dos sinais e vocabulário

O sinal normalizado (`SIGNAL_CONTRACT_VERSION = 1`) identifica origem, item de origem, disciplina, tópico ou disciplina inteira, período de calendário, escopo de concursos, disponibilidade, gravidade, evidência, motivos e observações. A chave da entidade é uma tupla serializada para não confundir IDs que contenham separadores. O construtor rejeita entidades e tipos inválidos; dias inválidos e períodos invertidos são omitidos. A data de calendário não é tratada como instante UTC.

Força da evidência (0–1) e completude dos campos (0–1) são dimensões distintas. Valor ausente continua ausente; `0` é um valor conhecido. Valores fora da escala não são truncados para criar falsa confiança. IDs de observação registram possível sobreposição, sem multiplicar o tamanho da amostra. O escopo de concursos ausente é diferente de uma lista vazia explicitamente conhecida.

O vocabulário usa gravidade crítica, importante, monitorar, sob controle e dados insuficientes; evidência baixa, moderada, alta e não avaliada; tendência de melhora, estabilidade, piora ou insuficiente; resultado melhorado, estável, piorado, pendente ou insuficiente. Adaptadores aceitam rótulos legados sem reescrever o estado salvo. Gravidade baixa legada significa monitorar, não domínio confirmado.

O produtor de sinais de preparação preserva seus limiares atuais e fornece disciplina/tópico, granularidade, período e IDs das questões já consideradas. O platô permanece sinal da disciplina (28 dias completos); risco de consolidação permanece sinal do tópico (14 dias, incluindo hoje). A apresentação da qualidade da evidência usa o vocabulário compartilhado sem alterar seus limiares existentes.

Verificação do pacote 2: 444 testes unitários em cada fuso, sintaxe e bundle reproduzível; os dois fluxos E2E de sinais de preparação e qualidade da evidência passaram nos dois fusos.

## Pacote 3 — Consolidação e precedência

O diagnóstico consolida os produtores já existentes por disciplina ou tópico, com o escopo de concurso verificado antes da adaptação. Sinais arquivados, de outro concurso e sem entidade elegível ficam de fora. Agregados legados sem escopo explícito só entram quando o chamador já validou o escopo. Duas fontes para o mesmo tópico permanecem distintas, com origem, período, motivos e IDs de observação.

A precedência versão 1 escolhe, entre sinais ativos, risco de consolidação, lacuna crítica, platô, revisão prioritária, cobertura crítica, prioridade alta, coleta de evidência e manutenção. Empates usam o período mais recente e IDs estáveis. Incidência histórica e recomendação disponível ajudam a explicar o item, mas não transformam sozinhas uma evidência insuficiente em prioridade pessoal. A confiança apresentada vem do sinal principal: as confianças de fontes que podem compartilhar observações não são somadas.

“Sob controle” exige classificação de manutenção do motor existente com evidência pessoal suficiente. A ausência de alerta fica “não avaliada”, nunca é interpretada como domínio confirmado. Resultados e contagens de disciplina e tópico são separados para evitar contagem dupla. O score e a ordem de prioridade continuam vindo do motor atual; o consolidador não recalcula peso nem altera plano.

Uma ação aponta somente para a identidade de uma recomendação atual, elegível, pendente e do mesmo escopo. O custo de oportunidade usa uma proposta válida do planejamento existente e registra papéis de origem/destino, sem criar uma nova ação. O renderer atual recebe os metadados consolidados em atributos dos itens; a interface de Diagnóstico 2.0 permanece no pacote seguinte. Não há alteração de schema ou coleção persistida.

Os testes verificam precedência, confiança não somada, granularidade, escopo, arquivos, estabilidade, qualidade da evidência, elegibilidade da ação, custo de oportunidade, imutabilidade e vínculo com os motores existentes.

Verificação integrada dos três primeiros pacotes: `npm run check:all` passou em America/Sao_Paulo e UTC, cada execução com 461 testes unitários, bundle reproduzível e 182 E2E. Os snapshots foram verificados localmente no Windows.

## Estado dos pacotes 4–8

- **Diagnóstico 2.0:** uma entidade apresenta um sinal principal segundo a precedência versionada e mantém os outros motivos como contexto. Recuperação consistente usa quatro semanas completas com volume suficiente; dívida de revisão distingue total vencido, alta prioridade com impacto e tópicos em risco de consolidação.
- **Próxima melhor ação:** adapta a primeira recomendação pendente e elegível do motor atual, com justificativa, evidência e contexto do plano. A prévia não persiste mudanças; o plano só é salvo depois da confirmação e da validação de capacidade.
- **Linha do tempo e tópicos:** eventos de decisões, desempenho, planejamento e avaliações são filtráveis e agrupáveis por semana, mês ou fase registrada. A evolução dos tópicos usa snapshots congelados e não reescreve classificações passadas.
- **Metas de acerto:** `examBlueprint.subjects[].accuracyTarget` aceita valor individual ou `null` para herdar `metas.metaAprovacao`. A edição em lote afeta somente disciplinas selecionadas e não substitui domínio nem peso da prova.

## Regressão da jornada completa

O cenário Playwright em `tests/e2e/strategic-cycle.spec.js` percorre Desempenho → Diagnóstico → prévia → confirmação → sessão vinculada → fechamento. Verifica que a prévia deixa `studyPlans` intacto, que o plano confirmado cabe na capacidade semanal e que o fechamento registra minutos vinculados sem modificar o histórico anterior. A suíte completa também cobre Demo, restauração de backups legados, acessibilidade, responsividade e regressão visual. Na execução local em America/Sao_Paulo após essa jornada, `npm run check:all` passou com 461 testes unitários e 183 E2E. O resultado do CI Linux deve ser consultado após a publicação.

## Consolidação de produto — pacotes 3–5

A Próxima Melhor Ação distingue `ACTION_REQUIRED`, `ACTION_OPTIONAL`, `MAINTAIN_PLAN`, `INSUFFICIENT_EVIDENCE` e `NO_ELIGIBLE_ACTION`. A primeira recomendação pendente e elegível continua sendo escolhida na ordem do motor atual. Na ausência dela, o estado é derivado dos sinais já consolidados e da existência de plano; nenhuma ação é inventada para preencher o card.

`build-diagnosis-page-model.js` reúne os builders existentes e `build-performance-page-model.js` monta a visão selecionada de Desempenho. `app.js` fornece registros filtrados, acesso às métricas de tópicos e contexto de navegação; renderers e controladores tratam HTML e eventos. Essa extração não altera schema nem fórmulas.

A explicação “Por que a Prontidão mudou?” compara o último snapshot salvo do período selecionado com o último do período anterior. Ela reutiliza `compareReadinessSnapshots`; versões do algoritmo, pesos ou fatores disponíveis incompatíveis impedem uma conclusão. A interface mostra direção e valores reais dos fatores e evita atribuir pontos individuais quando o arredondamento do índice não permite decomposição exata.

Verificação local dos pacotes 3–5 em America/Sao_Paulo: `npm run check:all` passou com 465 testes unitários e 184 testes E2E, incluindo sintaxe e conferência dos artefatos gerados.

## Consolidação de produto — pacotes 6–7

O Mapa de Estabilidade aparece em Desempenho → Disciplinas. Ele cruza a precisão pessoal com a meta da disciplina e a evolução entre períodos equivalentes já calculada pelo comparador. Uma variação de pelo menos 3 pontos percentuais distingue melhora e queda; as quatro situações são Atenção, Manter, Intervir e Evoluindo. A disciplina só recebe quadrante quando há ao menos 10 questões em cada período. O mapa não calcula outra prioridade e cada disciplina abre o detalhamento existente.

A comparação por fase fica junto da linha do tempo estratégica. Novos fechamentos e retratos de Prontidão registram a fase vigente no momento da captura. O comparador usa somente esse campo salvo, separa o concurso ativo e considera apenas a revisão mais recente de cada fechamento semanal. Mostra precisão quando a fase tem pelo menos 30 questões, aderência quando há pelo menos 60 minutos planejados, total de questões e o último índice de Prontidão salvo na fase. Registros antigos sem fase permanecem no histórico, mas não ganham uma fase inferida posteriormente. A Demo gera esses metadados como parte de seu histórico fictício.

Verificação local dos pacotes 6–7 em America/Sao_Paulo: `npm run check:all` passou com 469 testes unitários e 185 testes E2E, além de sintaxe e conferência dos artefatos gerados. A comparação foi conferida em mobile, com a Demo e na jornada estratégica existente.
