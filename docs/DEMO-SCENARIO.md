# Cenário da demonstração 2.0

`src/demo/demo-scenario.json` é um blueprint declarativo, não um backup do estado. O validador confere formato, IDs, totais, escopos e cobertura das fases. O gerador cria o estado compatível com o schema atual usando seed e data-base; os builders de disciplinas e histórico de estudo tratam os primeiros três pacotes da migração.

## Conteúdo já migrado

- 17 disciplinas e 305 tópicos com IDs do blueprint. `COMUM` é traduzido para as tags reais de BB e Caixa no mesmo tópico, sem duplicá-lo.
- 140 dias, com sessões distribuídas entre as cinco fases de disponibilidade. Há dias sem estudo; as durações e tipos vêm do cenário.
- 200 sessões e 1.750 questões de estudo. Questões continuam vinculadas à sessão e ao tópico. Acertos usam a trajetória mensal e a meta da disciplina; erros usam os perfis por disciplina ou um perfil padrão.
- `progressHistory` representa a conclusão registrada dos tópicos ao longo da janela, e não uma série de prontidão.

Para reproduzir uma demonstração, forneça a mesma seed, data local e versão do JSON a `generateDemoData`. Os builders não usam `Math.random()`.

## Próximos pacotes

Nove simulados, oito redações registradas como sessões anotadas e 50 revisões usam o blueprint. Redações não têm entidade própria nem entram nas questões objetivas; a nota aparece nas observações da sessão.

As 16 provas e 842 questões históricas são entidades separadas das 1.750 questões resolvidas. Treze provas são completas; três parciais contêm 18 classificações pendentes. O gerador mantém 92% de cobertura calculada sobre o total esperado declarado. Pelas regras atuais de Saúde da Base, essa cobertura gera confiança **moderada**, mesmo com 13 provas completas; o alvo textual de confiança alta no blueprint não é forçado no estado.

Doze semanas de planos diários usam os minutos planejados do cenário. O realizado é calculado das sessões; os números `actualMinutes` do JSON servem como referência narrativa, sem criar tempo de estudo fictício adicional. O plano de 720 minutos inclui uma proposta de transferência de 30 minutos entre Conhecimentos Bancários e Matemática Financeira, sujeita às salvaguardas do planejamento adaptativo.
