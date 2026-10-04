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
