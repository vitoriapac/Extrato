# Hierarquia editorial — pacotes 1–3

## Fundação

Os valores existentes de `--space-*` foram preservados. `styles/tokens.css` acrescenta alturas de linha, peso bold e aliases semânticos para ações, blocos e seções. Os papéis `.analytical-title`, `.analytical-result`, `.supporting-text` e `.analytical-metadata` são opt-in: não redefinem todos os títulos ou parágrafos da aplicação.

## Componentes

`renderActionGroup` reutiliza `renderAction`, escapa rótulos e oferece agrupamento acessível opcional. Ações usam flex, wrap e gap; em mobile têm alvo de toque de 44 px. Slots HTML aceitam apenas saída de renderers confiáveis, como nos disclosures existentes.

`renderDivider` distingue separação interna de mudança de seção. `.editorial-disclosure` oferece título intermediário, espaçamento e foco visível; sua aplicação é explícita, sem migrar todos os módulos nesta rodada.

## Visão Geral

O resumo preserva Prontidão, confiança e retenção. A projeção separa título, resultado, interpretação e acesso a Desempenho. A insuficiência aparece como resultado explícito; a ressalva sobre chance de aprovação permanece visível.

A ajuda de Prontidão fica dentro de “Como este índice foi calculado?”, junto às evidências e limitações. O artigo, o retorno à origem e o foco são preservados. “Investigar a faixa e o diagnóstico” continua disponível, fechado inicialmente. A transição para o fechamento recebe espaço e divisor de seção, sem acrescentar cards.

Nenhum cálculo, regra de prioridade, persistência, histórico, meta ou capacidade foi alterado. Timeline, sessões e microcopy geral ficam nos pacotes 4–5; a auditoria global permanece no pacote 6.

## Validação

Os contratos Node verificam escape, agrupamento, tokens preservados, ordem resultado → ação → explicação e ausência de mutação dos modelos. Uma jornada browser dirigida captura insuficiência e Demo densa em 390/1440 px claro/escuro, verifica 320 px e testa abertura por teclado e ajuda → retorno. As capturas são artefatos de inspeção, sem atualização automática de baselines.

- 24 testes Node relacionados passaram.
- Calibração/backup por teclado e as quatro regressões existentes do hero/leitura do fechamento passaram em 45,4 s, preservando as referências.
- A jornada editorial passou em 46,0 s. As dez capturas foram inspecionadas; controles fixos da página são retirados apenas durante a captura do módulo e restaurados em seguida.
- Fast passou em 61,46 s; Experience passou em 106,3 s. Os artefatos versionados foram regenerados pelo build.
- Full e auditoria humana com participantes/leitor de tela não foram executados nesta etapa. Os resultados são locais e não confirmam GitHub Actions.
