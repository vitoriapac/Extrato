# Hierarquia editorial — pacotes 1–6

## Fundação

Os valores existentes de `--space-*` foram preservados. `styles/tokens.css` acrescenta alturas de linha, peso bold e aliases semânticos para ações, blocos e seções. Os papéis `.analytical-title`, `.analytical-result`, `.supporting-text` e `.analytical-metadata` são opt-in: não redefinem todos os títulos ou parágrafos da aplicação.

## Componentes

`renderActionGroup` reutiliza `renderAction`, escapa rótulos e oferece agrupamento acessível opcional. Ações usam flex, wrap e gap; em mobile têm alvo de toque de 44 px. Slots HTML aceitam apenas saída de renderers confiáveis, como nos disclosures existentes.

`renderDivider` distingue separação interna de mudança de seção. `.editorial-disclosure` oferece título intermediário, espaçamento e foco visível; sua aplicação é explícita, sem migrar todos os módulos nesta rodada.

## Visão Geral

O resumo preserva Prontidão, confiança e retenção. A projeção separa título, resultado, interpretação e acesso a Desempenho. A insuficiência aparece como resultado explícito; a ressalva sobre chance de aprovação permanece visível.

A ajuda de Prontidão fica dentro de “Como este índice foi calculado?”, junto às evidências e limitações. O artigo, o retorno à origem e o foco são preservados. “Investigar a faixa e o diagnóstico” continua disponível, fechado inicialmente. A transição para o fechamento recebe espaço e divisor de seção, sem acrescentar cards.

Nenhum cálculo, regra de prioridade, persistência, histórico, meta ou capacidade foi alterado. Os pacotes 4–6 abaixo completam os registros, a microcopy e a revisão dirigida desta fase.

## Pacotes 4–5 — registros e microcopy

A Linha do Tempo agrupa filtros em uma toolbar nomeada e mantém suas regras de escopo na metodologia fechada. Títulos de eventos, texto de apoio e datas têm papéis distintos. Os filtros, agrupamentos, limite inicial de cinco eventos e históricos congelados foram preservados.

O cronômetro utiliza o grupo de ações existente. O acesso a evolução/consistência fica junto de “Distribuição por disciplina”, oculto no modo foco. Estatísticas vazias não acrescentam um divisor solto.

O histórico de sessões mostra o total no cabeçalho; o resultado filtrado aparece ao lado dos filtros somente quando é diferente, mantendo o contexto de um dia selecionado. A ausência completa de sessões orienta o primeiro registro; um filtro sem resultados orienta a ajustar os filtros. A geração desse texto fica no renderer, sem modificar seleção, registros ou crédito temporal.

Prioridades usam “1 registro” e “N registros”. As datas resumidas são apresentadas como dia/mês diretamente do calendário ISO, sem conversão de timezone. Os vazios de timeline/prioridades reutilizam o estado vazio compartilhado com orientação contextual.

## Pacote 6 — revisão dirigida

A inspeção de 16 capturas de Linha do Tempo, estudo, histórico de sessões e fechamento cobre estado vazio e Demo densa em 390 px claro e 1440 px escuro. A jornada também verifica 320 px, uma sessão, filtro sem resultados, limpeza e encaminhamento ao cronômetro. Prontidão já possui dez capturas e contratos dirigidos dos pacotes 1–3.

Dois achados visuais foram corrigidos: divisor de estatísticas vazias e falta de gap entre as ajudas do fechamento. Ajudas agora usam `renderActionGroup`; a apresentação não altera decisões nem suas confirmações.

## Validação local dos pacotes 1–3

Os contratos Node verificam escape, agrupamento, tokens preservados, ordem resultado → ação → explicação e ausência de mutação dos modelos. Uma jornada browser dirigida captura insuficiência e Demo densa em 390/1440 px claro/escuro, verifica 320 px e testa abertura por teclado e ajuda → retorno. As capturas são artefatos de inspeção, sem atualização automática de baselines.

- 24 testes Node relacionados passaram.
- Calibração/backup por teclado e as quatro regressões existentes do hero/leitura do fechamento passaram em 45,4 s, preservando as referências.
- A jornada editorial passou em 46,0 s. As dez capturas foram inspecionadas; controles fixos da página são retirados apenas durante a captura do módulo e restaurados em seguida.
- Fast passou em 61,46 s; Experience passou em 106,3 s. Os artefatos versionados foram regenerados pelo build.
- Full e auditoria humana com participantes/leitor de tela não foram executados nesta etapa. Os resultados são locais e não confirmam GitHub Actions.

## Validação local dos pacotes 4–6

- 29 testes Node relacionados passaram, cobrindo apresentação, sessões, prioridades, timeline e ações do fechamento.
- As jornadas dirigidas passaram: listas da Demo densa, filtros/históricos com backup, registro de sessão, modo foco e hierarquia editorial. O recorte de sessão, históricos e regressão visual desktop passou em 28,4 s; as referências visuais existentes foram preservadas.
- As 16 capturas dos novos estados foram inspecionadas. A captura isola o módulo removendo temporariamente controles fixos e o banner da Demo; esses elementos são restaurados depois. A última execução das três jornadas editoriais/modo foco terminou sem falhas.
- Fast passou em 69,99 s; Experience passou em 108,85 s. Build, reprodutibilidade dos artefatos e inventário passaram.
- Full não foi executado nesta rodada de apresentação. Não houve auditoria com participantes/leitor de tela nem confirmação de GitHub Actions.
