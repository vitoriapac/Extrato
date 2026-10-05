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

## Pacote 6 — ciclo verificável e ajuda contextual

O ciclo continua reutilizando as recomendações, plano e fechamento existentes. A jornada estratégica cobre prova → decisão → prévia/confirmar → execução → resultado → fechamento; a ajuda agora também é verificada na Demo, preservando registros, período de 90 dias, subvisão e concurso.

Prontidão, aderência e sustentabilidade oferecem artigos específicos. Projeção já tinha seu link metodológico; seu artigo passa a encaminhar à trajetória em Desempenho, proprietário do detalhe. A navegação contextual cria “Voltar à análise de origem” somente quando um artigo é aberto a partir de outra tela. O contexto é transitório, sem persistência; ao retornar, a análise e o foco são recuperados, inclusive quando o botão está em um disclosure.

Os cinco perfis novos da Demo e a auditoria final estão descritos nos pacotes 7–8 abaixo. O retorno contextual amplia a jornada de Demo já executada no Experience.

## Pacote 7 — cinco perfis reproduzíveis

`DEMO_EXPERIENCE_PROFILES` descreve cinco massas fictícias, geradas com `generateDemoData({today:'2026-10-03',preparationProfile})`. A Demo pública padrão continua sendo o cenário denso de 140 dias; os perfis são opções explícitas do gerador para desenvolvimento e validação, sem novo seletor na interface.

| Perfil | Histórico | Evidência e decisão esperadas |
|---|---:|---|
| `beginner` | 7 dias | Até três sessões, sem simulados; trajetória/confiança insuficientes. Prontidão explicita os fatores ausentes, sem transformar falta de dados em mau desempenho |
| `regular` | 60 dias | Execução regular, simulados comparáveis e desempenho intermediário; interpretação conservadora das lacunas |
| `irregular` | 90 dias | Bons acertos com crédito temporal baixo; alerta de execução, sem inventar deficiência de conhecimento |
| `high_performance` | 100 dias | Cobertura concluída, bons resultados e execução consistente; trajetória no caminho e nenhuma intervenção obrigatória artificial |
| `final_stretch` | 140 dias | Prova em dez dias, queda recente e lacunas; reta final e capacidade semanal preservada |

O gerador usa os motores reais para produzir fechamento e Prontidão depois da evidência/execução fictícia. Os perfis não definem scores, estados de trajetória ou prioridade manualmente. Datas, IDs, vínculos sessão–questões–plano, somas de erros e orçamento de 720 minutos são verificados. Fechamentos anteriores à janela do perfil são excluídos antes de gerar seus snapshots; snapshots reais do usuário não passam por esse código.

A projeção continua limitada a confiança moderada quando suas regras permitem. Alto volume de estudo não promove automaticamente a confiança da projeção nem gera probabilidade de aprovação.

## Pacote 8 — auditoria de experiência

A jornada dos cinco perfis percorre Visão Geral → Hoje → Desempenho → Metas → fechamento em 390 px, verifica a leitura principal da trajetória e registra imagens para inspeção. É um único caso browser adicional no Full; Experience mantém suas jornadas dirigidas e ganha o quinto perfil na matriz Node.

| Pergunta de auditoria | Contrato observado |
|---|---|
| Qual informação vem primeiro? | Situação atual e trajetória antes do histórico/investigação |
| Sei como agir? | Hoje apresenta atividade e CTA existentes; alteração estratégica conserva prévia/confirmar |
| A conclusão foi duplicada? | Metas mantém resumo e acesso à origem; detalhes ficam no proprietário |
| Preciso ler tudo? | Métodos, fatores e comparação começam em disclosures fechados |
| Posso conferir a origem? | Evidência visível, métodos acessíveis e ajuda contextual com retorno |
| O mobile continua legível? | Verificação de overflow nas cinco telas e capturas dos cinco perfis |

Essas verificações e a inspeção das imagens são uma auditoria técnica. Não equivalem a um estudo de compreensão de cinco segundos com participantes ou uma sessão manual com leitor de tela.

### Correções encontradas na auditoria

- O botão de ajuda contextual se esticava como item do grid de aderência. O componente agora mantém largura pelo conteúdo e a mesma ação secundária; os cinco baselines de aderência foram inspecionados e revistos sem elevar tolerância.
- O perfil irregular herdava baixa cobertura e acumulava estudo adicional fictício que inflava seu volume recente. Sua massa agora representa cobertura concluída, bons acertos e execução limitada por semana, incluindo sessões sem vínculo. Identidades, resultados de questões e vínculos são preservados; a reconciliação existente recalcula o crédito. Os contratos verificam baixa execução tanto na semana civil quanto no recorte de 30 dias utilizado pela trajetória.
- As imagens de auditoria removem temporariamente elementos fixos da página para capturar o módulo sem sobreposição, restaurando-os em seguida. Isso não altera a apresentação da aplicação nem cria novos baselines.

Crédito temporal da semana e volume recente são medidas com períodos/denominadores distintos. A auditoria compara classificações com a mesma base quando possível, sem exigir igualdade numérica entre esses recortes.

## Validação local dos pacotes 1–3

- 24 testes Node relacionados passaram (seleção de impacto, contratos de UI/controller e projeção).
- O caso visual desktop claro passou em 30,9 s após a correção de seletor; os outros três passaram em 1,5 min. Nenhuma referência ou tolerância foi alterada.
- Experience final passou em **87,49 s**, incluindo iniciante, Demo, sugestão fora do plano e ciclo estratégico completo.
- Fast final passou em **47,59 s**, incluindo todos os Node nos dois fusos, smoke browser, inventário, sintaxe e artefatos reproduzíveis.
- Build reproduzido. Links locais e diff revisados. Full e avaliação humana com leitor de tela não foram executados nesta etapa.

Os commits destes pacotes estão locais; a aprovação do CI anterior não confirma o workflow modificado até sua publicação.

## Validação local dos pacotes 4–6

- 43 testes Node relacionados passaram, incluindo apresentação, ajuda, metas, sustentabilidade e contratos do ciclo estratégico.
- As quatro comparações de Desempenho/Metas passaram com as referências existentes em 375/1440 px, claro/escuro.
- A jornada de calibração passou, preservando backup, histórico congelado e acesso por teclado aos detalhes.
- As cinco jornadas densas de sustentabilidade passaram. As capturas agora usam alinhamento de pixels; as referências de 375 px escuro e 430 px claro foram substituídas individualmente após inspeção de expected/actual/diff. Conteúdo, valores e CTA foram preservados, com tolerância de 0,08. Veja a [política visual](VISUAL-TEST-POLICY.md).
- A jornada contextual verifica ajuda → retorno à origem e ajuda de projeção → trajetória, preservando período, concurso e os dados locais.
- Experience final passou em **105,63 s**, incluindo contratos nos dois fusos, iniciante, Demo densa, sugestão fora do plano e ciclo estratégico completo.
- Build conferido com `npm run check:bundle`: os quatro artefatos versionados estão atualizados e reproduzíveis.
- Fast final passou em **52,75 s**, incluindo todos os testes Node em UTC/São Paulo, smoke browser, sintaxe, inventário e artefatos gerados.

Full, a matriz visual global e avaliação humana com leitor de tela não foram executados nesta etapa. Permanecem no encerramento dos pacotes 7–8; esta etapa não alterou persistência, cálculos ou semântica dos snapshots.

## Validação local dos pacotes 7–8

- Os 15 testes Node relacionados de Demo e coerência passaram, incluindo determinismo, janela histórica, vínculo de questões/sessões/plano, soma de erros e capacidade de 720 minutos.
- A jornada dos cinco perfis passou em aproximadamente dois minutos; percorreu as cinco superfícies em 390 px sem overflow ou contradição nos estados da trajetória.
- Experience final passou em **107,83 s**; Fast final passou em **63,42 s**, dentro do orçamento de 120 s, com 725 testes Node em cada fuso. A auditoria dos cinco perfis fica no Full; o smoke cotidiano não ganhou essa massa browser.
- Full final passou em **2.261,93 s (37min42s)**: 725 testes Node em UTC e outros 725 em São Paulo, 242 casos browser UTC e 48 no recorte São Paulo. Sintaxe, inventário, contratos dos tiers e artefatos gerados também passaram.
- O Full incluiu referências visuais Windows, Demo densa, acessibilidade automatizada/teclado, backups legados, atualização PWA, isolamento do simulador e o ciclo Desempenho → Diagnóstico → prévia → confirmação → execução → fechamento.
- As falhas visuais iniciais de aderência e o volume inflado do perfil irregular foram investigados e corrigidos; os casos falhos e relacionados passaram antes da execução final completa. Nenhuma tolerância visual foi ampliada.
- A inspeção técnica das cinco imagens de trajetória foi concluída. Estudo com participantes e sessão manual com leitor de tela não foram executados. Os gates são locais; a execução do GitHub Actions depende da publicação dos commits.
