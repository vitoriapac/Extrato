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

## Simplificação aplicada — pacote 4

- **Hoje:** plano e atividades confirmadas precedem a sugestão opcional. As duas superfícies usam títulos e regiões semânticas distintos; os itens de execução continuam visíveis.
- **Hoje no desktop:** as ações ficam abaixo da explicação da sugestão, evitando que seus botões comprimam o texto em uma coluna estreita. A inspeção das imagens detectou esse problema, e o E2E passou a proteger uma largura útil de leitura.
- **Desempenho:** o resumo é seguido pelo histórico de evolução e então pela projeção. A comparação detalhada mantém seu disclosure; os valores dos motores são reutilizados.
- **Metas:** objetivos editáveis precedem disponibilidade, planejamento e execução. A numeração das seções segue essa ordem. O fechamento continua sendo um resumo com acesso ao detalhe completo.
- **Visão Geral:** a fórmula de retenção fica em “Como a retenção é calculada?”, depois dos resultados por tópico. A confiança e a disponibilidade continuam junto aos resultados que qualificam.

Diagnóstico e Inteligência da Prova preservam os destinos identificados no inventário. Não foi identificada redundância semântica suficiente para transferir ou retirar seus blocos nesta rodada.

## Rechecagem por perfil

```powershell
$env:AUDIT_PHASE='after'
$env:AUDIT_MODE='inspection'
npx playwright test --config=tests/audits/playwright.config.js
```

O [relatório após a simplificação](../tests/audits/product-journey-audit-after.json) registra uma inspeção dirigida dos seis perfis e exige o plano antes da sugestão. Este modo conserva as prévias de planejamento, a navegação e o retorno; não repete os quatro registros transacionais de cada perfil. As contagens totais antes/depois não são comparáveis porque a cobertura de interações difere. O relatório inclui hashes dos arquivos de apresentação para identificar o código inspecionado mesmo antes do commit.

A auditoria tem servidor próprio na porta 4174. Uma primeira rechecagem compartilhava a porta cotidiana e falhou quando a outra suíte encerrou o servidor; o isolamento corrige esse problema de infraestrutura. Nenhum retry foi adicionado.

## Validação dos pacotes 3 e 4

A rechecagem dirigida dos seis perfis passou em 3,9 minutos e não registrou inversão entre plano/sugestão nem overflow de página. O Fast final passou em 55,09 segundos, incluindo Node em UTC/São Paulo, sintaxe, inventário e artefatos reproduzíveis. Os unitários relacionados a execução diária, diagnóstico, aderência e apresentação também passaram.

As jornadas de primeiro plano e ciclo estratégico passaram em 21,4 segundos. A seleção inicial de ação compartilhada e refinamento visual passou em 57,6 segundos. Após a correção da coluna estreita, Hoje foi revalidado em 1440/390 px em 22,6 segundos; as duas comparações finais com Demo densa (desktop claro e mobile escuro) passaram em 55,8 segundos. Uma nova asserção usava um seletor inexistente para o histórico; o seletor foi corrigido e os dois casos afetados foram repetidos com sucesso. Nenhum PNG de referência foi atualizado.

Full, matriz visual global e avaliação manual com leitor de tela ficam para o fechamento da fase. A auditoria não confirma resultados do GitHub Actions. `src/app.js` não recebeu lógica adicional.

## Pacotes 5 a 7 — apresentação, listas e microcopy

A [fachada de apresentação analítica](../src/ui/components/analytical-presentation.js) reúne componentes para resumos, indicadores, evidências, explicações, insights, ações, tendências, vazios e disclosures. Desempenho e a orientação de planejamento reutilizam essa apresentação sem recalcular os indicadores.

A lista progressiva também cobre mudanças de Desempenho, motivos auxiliares de diagnóstico, fatores de Prontidão e eventos de tópicos. Listas que já possuíam disclosure mantêm sua implementação, e atividades operacionais/confirmatórias preservam os itens necessários à decisão.

A [revisão de microcopy](MICROCOPY-CONTRACT.md) encurta o contexto permanente da sugestão, do diagnóstico e das comparações. Critérios, escopo e limitações continuam acessíveis em disclosures. O pacote 7 passou em 27 testes Node relacionados, dois casos browser de execução/sugestão em 35,3 s e Fast em 55,58 s. Os bundles foram reproduzidos pelo build.

## Pacote 8 — coerência do produto

O [gate de experiência](PRODUCT-EXPERIENCE-GATE.md), executado por `npm run test:experience`, reúne os cenários de iniciante, estudante com dados, sugestão fora do plano, baixa aderência e reta final. Reutiliza quatro jornadas browser e os perfis Node existentes. Metas e Fechamento passam a ter uma asserção explícita de igualdade de classificação e medidas quando recebem a mesma semana civil, escopo e registros; janelas móveis não são comparadas como se fossem a mesma semana.

A jornada de iniciante usa o estado padrão limpo. A projeção permanece sem número, a configuração tem CTA e o catálogo inicial pode oferecer estudo introdutório como sugestão opcional com evidência baixa. Isso distingue coleta de evidência de uma intervenção obrigatória injustificada.

O gate dirigido passou em 88,38 s. O Fast final passou em 46,87 s. A seleção Full contém 241 casos browser e preserva um único smoke browser no Fast. Os quatro perfis de coerência reutilizam seus dados determinísticos e confirmam que a leitura não altera o estado.

### Referências visuais revistas

Uma primeira rodada de Full foi interrompida após identificar recortes da trajetória com 1 px extra. A reprodução mediu uma origem fracionária de 3027,9375 px para um card de 1784,6875 px: o PNG tinha 1786 linhas, embora seu conteúdo e dimensões fossem equivalentes à referência de 1785 linhas. O helper agora alinha apenas a origem da captura e restaura o estilo depois da asserção.

As referências de 375, 430 e 1440 px da trajetória passaram sem alteração. A referência de 320 px tinha o mesmo pixel extra de recorte e foi revista após inspeção da imagem e do diff. As três referências de Hoje foram revistas por uma alteração visual real: texto curto e disclosure substituem a orientação longa e o botão permanente. Esses casos passaram com axe e teclado. Nenhuma tolerância foi ampliada. Sustentabilidade passou nas cinco combinações existentes, sem alteração dos PNGs.

### Encerramento local da fase

Full passou em Windows/Chromium, Node 24.20.0, em **2137,93 s (35 min 38 s)**: 716 testes Node em UTC e 716 em São Paulo, 241 E2E em UTC e 48 E2E no recorte de São Paulo. A execução inclui referências visuais, acessibilidade automática, teclado, Demo densa, backup legado, PWA e os ciclos estratégicos completos. Sintaxe, inventário, classificação e artefatos reproduzíveis também passaram.

O runner emitia um aviso de orçamento para o Full porque comparava o tempo com `max: null`. A condição do aviso agora exige um limite numérico finito; os estágios, seleções e limites de Fast/Regression permanecem os mesmos. Essa correção do relatório foi validada por sintaxe, testes de seleção e descoberta em dry-run, sem repetir a matriz browser já aprovada.

Os resultados são locais; o GitHub Actions não foi consultado nesta implementação. Não foi feita avaliação manual com leitor de tela. As revisões Markdown e do relatório posteriores ao Full não alteram os motores ou os assets da aplicação.
