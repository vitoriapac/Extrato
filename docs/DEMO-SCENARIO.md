# Cenário da demonstração 2.0

`src/demo/demo-scenario.json` é um blueprint declarativo, não um backup do estado. O validador confere formato, IDs, totais, escopos e cobertura das fases. O gerador cria o estado compatível com o schema atual usando seed e data-base; os builders de disciplinas e histórico de estudo tratam os primeiros três pacotes da migração.

## Conteúdo já migrado

- 17 disciplinas e 305 tópicos com IDs do blueprint. `COMUM` é traduzido para as tags reais de BB e Caixa no mesmo tópico, sem duplicá-lo.
- 140 dias, com sessões distribuídas entre as cinco fases de disponibilidade. Há dias sem estudo. O builder de sustentabilidade ajusta durações em 16 semanas encerradas para apresentar padrões de execução; tipos, datas, IDs e questões vinculadas são preservados.
- 200 sessões e 1.750 questões de estudo. Questões continuam vinculadas à sessão e ao tópico. Acertos usam a trajetória mensal e a meta da disciplina; erros usam os perfis por disciplina ou um perfil padrão.
- `progressHistory` representa a conclusão registrada dos tópicos ao longo da janela, e não uma série de prontidão.

Para reproduzir uma demonstração, forneça a mesma seed, data local e versão do JSON a `generateDemoData`. Os builders não usam `Math.random()`.

## Avaliações, planejamento e histórico

Nove simulados, oito redações registradas como sessões anotadas e 50 revisões usam o blueprint. Redações não têm entidade própria nem entram nas questões objetivas; a nota aparece nas observações da sessão.

As 16 provas e 842 questões históricas são entidades separadas das 1.750 questões resolvidas. Treze provas são completas; três parciais contêm 18 classificações pendentes. O gerador mantém 92% de cobertura calculada sobre o total esperado declarado. Pelas regras atuais de Saúde da Base, essa cobertura gera confiança **moderada**, mesmo com 13 provas completas; o alvo textual de confiança alta no blueprint não é forçado no estado.

O planejamento diário inclui 16 semanas encerradas com carga de 600 minutos por semana e disponibilidade demonstrativa registrada de 720 minutos. Os blocos são vinculados às sessões e preservam prioridade e contexto no momento da criação. O plano semanal de 720 minutos inclui uma proposta de transferência de 30 minutos entre Conhecimentos Bancários e Matemática Financeira, sujeita às salvaguardas do planejamento adaptativo. `actualMinutes` no JSON continua sendo referência narrativa.

Vinte decisões de recomendação incluem aceitação, recusa, execução, melhora, estabilidade e ausência de resultado posterior. Somente os exemplos com questões posteriores vinculadas recebem resultado medido pelo avaliador do aplicativo; os demais aguardam evidência. Os 14 fechamentos são retratos calculados das sessões, questões e planos de cada período, com o mesmo escopo BB + Caixa; a série `strategicFocusPct` do blueprint é uma trajetória de referência, não um valor gravado diretamente.

## Sustentabilidade do planejamento

Os períodos são relativos à segunda-feira da semana atual. Cada grupo contém quatro semanas encerradas:

| Período | Plano semanal | Execução semanal | Prioridades | Interpretação calculada |
|---|---:|---:|---:|---|
| Semanas 1–4 | 600 min | 570 min | 95% | Plano compatível |
| Semanas 5–8 | 600 min | 580 min | 50% | Prioridades pendentes |
| Semanas 9–12 | 600 min | 660 / 240 / 600 / 300 min | 90% | Execução irregular |
| Semanas 13–16 | 600 min | 420 min | 90% | Carga acima da execução recente |

O realizado é obtido das sessões demonstrativas, não gravado diretamente no resultado analítico. Crédito permanece limitado por bloco; volume excedente não substitui prioridades. Os fechamentos agora são semanas de segunda a domingo e congelam sustentabilidade, contexto e política. Os últimos quatro permitem explorar a prévia de capacidade na Demo. Cenários personalizados sem sessões suficientes deixam lacunas explícitas.

Os 200 registros de sessões, 1.750 questões, 17 disciplinas e 305 tópicos permanecem preservados. Esses dados são fictícios e isolados da base real; o builder nunca é chamado para migrar dados pessoais. Consulte [Sustentabilidade do planejamento](PLANNING-SUSTAINABILITY.md).

Se uma demonstração anterior estiver aberta, use **Reiniciar demo** para carregar os novos períodos. Reiniciar afeta somente a base demonstrativa.

Os 14 fechamentos da demo também geram `readinessSnapshots`, com evidências limitadas à data de cada período e com o mesmo cálculo ponderado do índice atual. Os oito valores em `readinessHistory` no blueprint continuam como referência narrativa e não são gravados diretamente. `progressHistory` permanece exclusivo da conclusão de conteúdo.

## Caderno de Erros e Flashcards

O builder determinístico [`src/demo/demo-builders/error-notebook.ts`](file:///c:/Users/vitor/Documents/Extrato/src/demo/demo-builders/error-notebook.ts) gera 17 flashcards baseados no algoritmo SM-2 adaptado com pegadinhas de bancas examinadoras (Cesgranrio e Cespe/Cebraspe):

- **Disciplinas cobertas:** Língua Portuguesa, Conhecimentos Bancários, Matemática Financeira, Atendimento e Vendas, Noções de Probabilidade e Estatística, Informática e Atualidades do Mercado Financeiro.
- **Distribuição de maturidade:**
  - **11 cartões pendentes de revisão hoje (`intervalDays = 1, repetition = 0`):** Prontos para execução imediata na aba Questões & Simulados ou pelo aviso de revisão na aba Hoje (`ErrorNotebookDueNotice.tsx`).
  - **6 cartões consolidados/dominados (`intervalDays = 14..30, repetition >= 2`):** Demonstram a progressão de retenção e estabilidade de longo prazo no gráfico de status do deck.
- **Metadados pedagógicos:** Cada cartão contém conceito correto, pegadinha típica da banca e regra mnemônica para recall ativo.

## Detector de Platô e Prescrições de Quebra

O builder de sessões [`src/demo/demo-builders/study-history.ts`](file:///c:/Users/vitor/Documents/Extrato/src/demo/demo-builders/study-history.ts) calibra 2 tópicos com estagnação de precisão na janela móvel dos últimos 28 dias com volume amostral robusto (>= 40 questões resolvidas):

1. **Concordância verbal (Língua Portuguesa):** Taxa média de acerto calibrada em ~65% em 4 sessões consecutivas no último mês, ativando a prescrição pedagógica de **Recall Ativo (`active_recall`)** com foco em testes intercalados.
2. **Probabilidade condicional (Probabilidade e Estatística):** Taxa média de acerto calibrada em ~55% em 4 sessões consecutivas no último mês, ativando a prescrição pedagógica de **Revisão de Pré-requisitos (`prerequisite_review`)** para consolidar a base teórica de teoria dos conjuntos e probabilidade básica.

O card [`PlateauDetectorCard.tsx`](file:///c:/Users/vitor/Documents/Extrato/src/ui/tabs/questions/PlateauDetectorCard.tsx) na aba Questões & Simulados exibe esses diagnósticos com comparativos de tendência e ações de quebra de platô em 1 clique.

## Eficiência Cronobiológica e Análise de Fadiga

As 200 sessões de estudo da demonstração são distribuídas realisticamente entre os três turnos do dia:

- **Manhã (7h–10h):** Turno de pico cognitivo, com 80% das sessões em foco profundo (`focusLevel: 'deep'`), nível de energia alto (`energyLevel: 'high'`) e maior taxa média de acerto (~82%).
- **Tarde (13h–16h):** Turno intermediário, com alternância de foco normal e sessões operacionais de exercícios.
- **Noite (19h–21h):** Turno com sinais de exaustão, concentrando sessões com nível de energia baixo (`energyLevel: 'low'`), foco distraído e taxa de acerto reduzida (~68%), disparando o **Alerta de Fadiga e Desgaste Cognitivo** na análise semanal.

A análise pode ser visualizada pelo card [`ShiftEnergyCard.tsx`](file:///c:/Users/vitor/Documents/Extrato/src/ui/tabs/performance/ShiftEnergyCard.tsx) na aba Desempenho.

## Balanço de Alocação e Navegação do Tour

- **Edital Verticalizado com Pesos Explícitos:** O gerador injeta pesos percentuais e questões estimadas em `examBlueprint.subjects` para Caixa e Banco do Brasil, permitindo ao componente [`AllocationBalanceGrid.tsx`](file:///c:/Users/vitor/Documents/Extrato/src/ui/tabs/dashboard/AllocationBalanceGrid.tsx) na Camada 3 do Cockpit calcular com precisão as matérias subalocadas e sobrealocadas em relação ao impacto real na prova.
- **Roteiro do Banner da Demonstração:** O banner superior [`#demoBanner`](file:///c:/Users/vitor/Documents/Extrato/index.html) inclui atalhos diretos para as áreas centrais do roteiro: `Prioridades`, `Riscos e projeção`, `Desempenho`, `Questões & Platô`, `Revisões`, `Planejamento` e `Relatório`.
- **Integridade de Estado:** A demonstração opera em `sessionStorage` isolado sob o Schema v30, preservando os registros reais do usuário e simulando backup recente via `lastExportAt`.

## Jornada do modo demonstração

- O botão **Explorar demonstração** apresenta uma prévia. A confirmação entra na Demo na Visão geral e no topo; cancelar não ativa o modo nem grava o cenário fictício.
- O tour essencial destaca o título do plano de hoje. A orientação diz para fechar o tour antes de experimentar **Iniciar**, que abre o cronômetro vinculado à atividade.
- No modo foco, o aviso **Dados fictícios · modo demonstração** aparece somente na Demo. O aviso fica junto ao tipo e à meta da sessão; em telas estreitas, o texto decorativo superior é ocultado para manter o botão de saída separado do conteúdo.
- **Sair da demonstração** remove a chave `bb-premium-study-demo`, define o modo como `real` e retorna à Visão geral no topo. O estado real em `localStorage` é comparado antes da saída e depois do retorno nos testes E2E.

Os contratos da jornada estão em [`tests/e2e/demo.spec.js`](../tests/e2e/demo.spec.js), com o modo real coberto em [`tests/e2e/daily-execution.spec.js`](../tests/e2e/daily-execution.spec.js) e a sincronização de visibilidade em [`tests/unit/demo-controller.test.js`](../tests/unit/demo-controller.test.js).
