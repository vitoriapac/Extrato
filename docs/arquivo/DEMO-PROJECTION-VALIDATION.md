# Demo e validação da trajetória

O ciclo anterior tinha sete pacotes; após os pacotes 5 e 6 restava apenas Demo e validação integrada. Essa conclusão foi dividida em duas entregas, sem criar novas funcionalidades fora do roadmap.

## Perfis determinísticos

A Demo padrão permanece inalterada. generateDemoData aceita preparationProfile para validação e desenvolvimento:

- standard: cenário editorial existente.
- recovery: evolução, queda temporária e recuperação dos simulados.
- final_stretch: prova em dez dias e queda recente, produzindo estado Em risco.
- limited_evidence: apenas duas datas recentes de simulado; a trajetória informa dados insuficientes apesar do volume de estudo.

Cada perfil usa cópia do blueprint. Nenhum modifica o perfil padrão ou recalibra os motores reais. Os registros são fictícios; horas não são convertidas em ganho de nota. Os perfis não acrescentam seletor público ou campos ao backup.

## Jornada integrada

A cobertura existente preserva prévia, confirmação, capacidade, execução e fechamento. A jornada adicional usa a massa de 140 dias em 390 px e conecta Trajetória → explicação → ajuda contextual → fechamento → ajuda, verificando que navegação não altera sessões, planos ou snapshots.

Unitários protegem determinismo, volume, risco próximo da prova, evidência insuficiente e ausência de probabilidade de aprovação. As jornadas existentes de ciclo estratégico e backup legado complementam a validação dirigida. O manifesto Full não foi ampliado; o novo caso permanece disponível no arquivo já classificado.

## Evidência local (2026-10-04, Windows/Chromium)

- Fast: 102,19 s; 698 testes Node passaram em UTC e em America/Sao_Paulo, além do smoke browser.
- Nova jornada de reta final: 1 caso, 45,0 s.
- Demo de todas as áreas, ciclo estratégico e backup schema 19: 3 casos, 44,7 s.
- Build e check:bundle reproduzíveis. Full e matriz visual completa não foram executados nesta tarefa, que não alterou persistência, fórmulas ou semântica de snapshots. Validação local não confirma GitHub Actions.
