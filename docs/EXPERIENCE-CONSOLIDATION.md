# Consolidação da experiência — ciclo iniciado em c28b51d

## Pacote 1 — infraestrutura remota

Experience passa a ser um status independente por impacto no CI, mantendo Fast em PR, Regression no push e Full para contratos globais/release. O plano de impacto explicita `experienceRequired`, com fallback conservador quando não conhece o arquivo ou o diff. O runner grava relatórios JSON por caso e resumo de fusos/tempos; os artefatos não dependem de descobrir manualmente qual jornada falhou.

O [CI anterior de c28b51d](https://github.com/vitoriapac/Extrato/actions/runs/37350737266) terminou com sucesso em 5/10/2026, incluindo validation e visual-windows. A integração nova precisa de publicação e execução remota para ser confirmada. Não confundir teste local com resultado do Actions.

## Pacote 2 — propriedade operacional

A [matriz](INFORMATION-OWNERSHIP.md) especifica proprietário, resumo permitido, destino e chave de contexto. Preserva as superfícies atuais, sem inventar abas Prova/Fechamento ou transferir fatores globais da Prontidão. Cada redução exige comparar entidade, concurso, período, unidade, denominador e fonte.

## Pacote 3 — narrativa de Desempenho

A visão geral mantém os indicadores e até três insights já calculados, apresenta a trajetória atual antes do histórico e oferece investigação por Disciplinas, Questões, Simulados e Consistência. O histórico congelado permanece acessível, assim como comparação, plano e mudanças. As subvisões continuam sendo o detalhe: não copiar todas para a visão geral.

Não há alteração de algoritmo, meta, capacidade, snapshot ou persistência. Os botões reutilizam o controller existente e preservam período/concurso. O resumo mantém suas referências visuais; a auditoria verifica a nova ordem, navegação e overflow em mobile/desktop, claro/escuro.

### Achados e tratamento

| Achado | Tratamento |
|---|---|
| Histórico da Prontidão precedia a trajetória atual | Trajetória promovida, histórico preservado depois da investigação |
| Visão geral tinha números, mas não encaminhava diretamente ao detalhe | Atalhos explícitos para as quatro subvisões, preservando filtros |
| Risco de acumular todas as análises na visão geral | Mantidos quatro indicadores e até três insights existentes; questões e disciplinas ficam nas subvisões |
| Insuficiência pode ser confundida com desempenho ruim | Mantidos os estados vazios orientados e requisitos reais da projeção |
| Atalhos novos competiam com seletores da navegação principal | Atributo próprio `data-performance-investigate`; controller reutiliza a atualização validada de estado |

As quatro comparações Windows de resumo/Metas passaram com os PNGs existentes. Os casos percorrem as seis subvisões e verificam overflow em 375/1440 px, claro/escuro. Isso comprova estrutura e navegação, não uma avaliação humana de compreensão em cinco segundos nem uso manual de leitor de tela.

Full permanece previsto para o encerramento; não é necessário repetir a matriz completa a cada pacote de apresentação.

## Pacote 4 — apresentação analítica

Diagnóstico, aderência e sustentabilidade reutilizam `renderDisclosure` da fachada analítica. Os detalhes começam fechados, com classe e corpo específicos da superfície. Não há cálculo nos componentes. Resultado, interpretação, evidência insuficiente e restrições permanecem fora da metodologia.

| Análise | Resultado/contexto visível | Explicação sob demanda |
|---|---|---|
| Prontidão | Índice, nível e confiança | Fatores e cálculo |
| Projeção | Estado, faixa, meta, confiança e limites essenciais | Base e método existentes |
| Aderência | Crédito, prioridades e qualidade da classificação | Vínculos, denominadores e contagens |
| Retenção/diagnóstico | Sinal dominante e evidência | Medidas e sinais auxiliares |
| Sustentabilidade | Estado, leitura preliminar, capacidade e ressalva | Critérios e semanas excluídas |
| Comparação | Mudança observada ou ausência de base | Critérios e detalhamento existentes |
| Decisão semanal | Principal sinal, decisão e confirmação necessária | Sinais auxiliares e resultados posteriores |

O contrato de quatro níveis continua válido: os três níveis de leitura não ocultam condições que qualificam o resultado. Nenhum score ou vocabulário alternativo foi criado.

## Pacote 5 — responsabilidades de Metas, fechamento e Visão Geral

Metas apresenta Resultado → Rotina → Volume, mantendo os mesmos sete controles, unidades e autoridade de edição. Seu resumo semanal mostra apenas medidas da semana e encaminha ao fechamento existente, sem repetir avanço e risco completos.

A Visão Geral mantém Prontidão global e confiança. Fatores ficam em “Como este índice foi calculado?”. A faixa atual aparece uma vez como resumo, com amostra/confiança e acesso a Desempenho; calibração especializada, critérios e diagnóstico detalhado continuam em “Investigar a faixa e o diagnóstico”. Essa calibração não foi apagada nem reinterpretada como a trajetória. O novo renderer é apresentação pura; cálculos e captura de snapshots permanecem nas funções existentes.

No fechamento, síntese e decisão precedem sinais auxiliares. Comparação semanal e contexto de trajetória ficam sob demanda; o resumo mantém a nota sobre comparabilidade e a necessidade de confirmação. Capacidade, prioridades e resultados posteriores preservam suas fontes.

## Validação local dos pacotes 1–3

- 24 testes Node relacionados passaram (seleção de impacto, contratos de UI/controller e projeção).
- O caso visual desktop claro passou em 30,9 s após a correção de seletor; os outros três passaram em 1,5 min. Nenhuma referência ou tolerância foi alterada.
- Experience final passou em **87,49 s**, incluindo iniciante, Demo, sugestão fora do plano e ciclo estratégico completo.
- Fast final passou em **47,59 s**, incluindo todos os Node nos dois fusos, smoke browser, inventário, sintaxe e artefatos reproduzíveis.
- Build reproduzido. Links locais e diff revisados. Full e avaliação humana com leitor de tela não foram executados nesta etapa.

Os commits destes pacotes estão locais; a aprovação do CI anterior não confirma o workflow modificado até sua publicação.
