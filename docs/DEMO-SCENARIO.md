# Cenário da demonstração 2.0

`src/demo/demo-scenario.json` é um blueprint declarativo, não um backup do estado. O validador confere formato, IDs, totais, escopos e cobertura das fases. O gerador cria o estado compatível com o schema atual usando seed e data-base; os builders de disciplinas e histórico de estudo tratam os primeiros três pacotes da migração.

## Conteúdo já migrado

- 17 disciplinas e 305 tópicos com IDs do blueprint. `COMUM` é traduzido para as tags reais de BB e Caixa no mesmo tópico, sem duplicá-lo.
- 140 dias, com sessões distribuídas entre as cinco fases de disponibilidade. Há dias sem estudo; as durações e tipos vêm do cenário.
- 200 sessões e 1.750 questões de estudo. Questões continuam vinculadas à sessão e ao tópico. Acertos usam a trajetória mensal e a meta da disciplina; erros usam os perfis por disciplina ou um perfil padrão.
- `progressHistory` representa a conclusão registrada dos tópicos ao longo da janela, e não uma série de prontidão.

Para reproduzir uma demonstração, forneça a mesma seed, data local e versão do JSON a `generateDemoData`. Os builders não usam `Math.random()`.

## Próximos pacotes

Simulados, revisões, redações, metas, provas históricas, recomendações, fechamentos e experiência de entrada continuam no formato anterior até seus respectivos pacotes. O alvo de nove simulados no JSON ainda não é a contagem exibida. Os totais resumidos dessas áreas são objetivos para geração futura, não registros a inserir diretamente no estado.
