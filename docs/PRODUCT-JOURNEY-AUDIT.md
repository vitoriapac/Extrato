# Auditoria de jornadas e simplificação

## Execução reproduzível

O pacote 3 usa seis perfis com relógio fixo em 5 de outubro de 2026: novo, inicial, intermediário, irregular, avançado e reta final. Os dados vêm dos defaults e dos cenários determinísticos existentes da Demo. O perfil inicial restringe registros datados aos últimos 14 dias; o avançado usa o cenário de recuperação com prazo maior, sem fabricar resultados melhores.

Executar separadamente dos gates cotidianos:

```sh
npx playwright test --config=tests/audits/playwright.config.js
```

O [runner da auditoria](../tests/audits/product-journey-audit.spec.js) abre configuração, disciplinas, planejamento, Hoje, Desempenho, Diagnóstico, replanejamento e fechamento em cada perfil. Registra sessões de estudo, questões, revisão e simulado pelos controles reais. Para os perfis configurados, abre e descarta uma proposta semanal. Para o novo usuário, registra o bloqueio de configuração em vez de fabricar uma data de prova. O caminho de retorno leva do fechamento a Hoje.

A auditoria por perfil complementa as jornadas transacionais existentes; não afirma que todas as combinações de onboarding, revisão agendada e redistribuição foram executadas. A confirmação completa do primeiro plano está em [onboarding.spec.js](../tests/e2e/onboarding.spec.js), e prévia, confirmação, execução, resultado e fechamento estão em [strategic-cycle.spec.js](../tests/e2e/strategic-cycle.spec.js). Estes arquivos devem ser executados junto à auditoria quando validar o ciclo.

O [relatório inicial](../tests/audits/product-journey-audit.json) é gerado com status, commit de origem, perfis, etapas, contagem de cliques, controles de escolha visíveis, CTAs, títulos repetidos e ocorrências de overflow. Relatórios de falha mantêm a mensagem do caso. A saída normal do Playwright guarda trace e imagem para investigação.

## Interpretação das medidas

- Cliques representam ativações observadas de botões, links e disclosures. A injeção da fixture não é contada como interação do usuário.
- Controles de escolha são uma medida da superfície disponível; não estimam o número de decisões mentais.
- CTAs são botões visíveis com a classe de ação principal. A contagem não significa, sozinha, conflito entre ações de tarefas diferentes.
- Títulos repetidos são candidatos para revisão com o [inventário de propriedade](INFORMATION-OWNERSHIP.md), não duplicações semânticas comprovadas.
- O relatório por perfil representa inspeção em desktop; a validação responsiva dirigida usa as jornadas e screenshots da superfície afetada.

## Achado que orienta o pacote 4

Hoje apresentava a recomendação antes do plano diário. Essa ordem conflita com a regra do [contrato de hierarquia](INFORMATION-HIERARCHY-CONTRACT.md): a atividade confirmada deve preceder a sugestão opcional. A correção deve preservar todos os itens do dia, as explicações da sugestão e os caminhos de acesso ao Diagnóstico.

Outros blocos representam contextos legítimos: o fechamento em Metas é um resumo com atalho; incidência histórica continua em Desempenho; Diagnóstico continua nas análises de Hoje. Uma nova aba não é necessária para melhorar a hierarquia.

## Política de cobertura

Este runner é uma auditoria explícita fora do manifesto cotidiano, não um substituto do Fast ou do Full. Evita adicionar seis reproduções extensas ao gate de cada commit. Os contratos de execução e retorno continuam protegidos em arquivos E2E existentes. Mudanças na persistência, no domínio ou nos snapshots exigiriam a validação ampla prevista em [AGENTS.md](../AGENTS.md).

## Resultado inicial

Os seis perfis passaram em 6,7 minutos. As duas jornadas dirigidas de primeiro uso e ciclo estratégico passaram em 21,4 segundos. A ordem da sugestão antes do plano foi registrada em todos os perfis. As medidas de escolhas e CTAs cobrem os elementos exibidos no layout, inclusive abaixo da primeira dobra; não representam apenas o primeiro viewport. O custo desta auditoria é registrado separadamente do orçamento do Fast.
