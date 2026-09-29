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
