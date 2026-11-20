# Plano do dia, sugestões e metas iniciais

## Escolha operacional

Hoje contextualiza a próxima melhor ação com o plano diário reconciliado. Se a ação não estiver no plano, a atividade planejada é a opção principal. A pessoa pode seguir o plano, pré-visualizar um ajuste, estudar a recomendação como atividade adicional ou dispensar a sugestão naquele momento. Dispensar apenas oculta a apresentação até a próxima renderização, sem registrar rejeição estratégica ou mudar o plano.

A prévia e a confirmação existentes continuam obrigatórias para mudar o planejamento. Iniciar uma atividade passa pela revalidação do controlador diário e pela proteção do cronômetro ativo. O motor de prioridade não foi alterado.

## Metas de partida

Os valores padrão são os mesmos. Sem registros de estudo, questões, simulados ou conclusão de tópicos, os campos que coincidem com os padrões são identificados como sugestões iniciais editáveis, com disponibilidade semanal explícita. Esses cards convidam a escolher objetivos em vez de apresentar uma dívida pessoal.

Não existe marca de aceite de metas nos backups antigos. A interface não inventa esse aceite nem afirma que valores iguais ao padrão foram personalizados. Valores editados diferentes do padrão e bases com atividade mantêm a leitura habitual. Alterar metas de volume não altera disponibilidade. Não houve alteração de schema, migração ou persistência.

## Validação

Node protege apresentação, imutabilidade, tipo e elegibilidade da próxima atividade, cronômetro e metas iniciais. Browser valida Metas em 320 px com axe, cancelamento/confirmação do ciclo estratégico e Demo densa. Full e baselines completos não são executados automaticamente nesta rodada.

## Evidência local

Em Windows/Chromium, 22 testes Node dirigidos passaram; o Fast final executou 702 casos em UTC e em America/Sao_Paulo e passou em 127,53 s. O smoke browser levou 56,25 s durante execução concorrente de jornadas; o total excedeu a meta de 120 s, mantendo-se abaixo da referência de 180 s. Não houve promoção de casos para o gate.

Passaram cinco jornadas browser: dispensa em 390 px com axe (50,0 s), e o conjunto de sessão vinculada, Metas em 320 px com axe, ciclo estratégico e Demo densa (1,7 min). Build, artefatos reproduzíveis e inventário foram conferidos. Full e matriz visual completa não foram executados. A validação local não confirma GitHub Actions.
