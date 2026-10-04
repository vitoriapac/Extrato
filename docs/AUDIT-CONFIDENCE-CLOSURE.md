# Fechamento da auditoria de confiança e acessibilidade

Os sete pacotes desta auditoria estão implementados. Não há um pacote 8 definido neste ciclo.

## Pacote 7 — configuração e teclado

Os rótulos de concurso, data, disponibilidade e nível por disciplina têm vínculos explícitos com seus controles. A troca de etapa devolve o foco ao botão de fechamento do modal, pois os controles anteriores são substituídos. Escape fecha o modal e retorna ao acionador; se ele não estiver visível, a aba Visão Geral recebe o foco.

A verificação automatizada usa nomes acessíveis e regras axe de formulários. Não equivale a uma sessão manual com leitor de tela.

## Validação

- Nove testes Node de apresentação do onboarding passaram.
- Dois testes browser de teclado, nomes acessíveis e Escape passaram (7,9 s), em 390 px para o novo caso.
- Auditoria axe de Disciplinas com Demo densa passou (41 s).
- Busca, retorno de Hoje e comparação visual do resumo foram validados no pacote anterior, sem modificar referências.
- O manifesto Full não foi ampliado; o caso novo permanece no arquivo existente.
- Full, matriz visual completa e leitor de tela manual não foram executados. O gate local não confirma GitHub Actions.

Não foram alterados cálculos, persistência, migrações ou snapshots históricos.

O Fast final passou; artefatos reproduzíveis confirmados por npm run check:bundle.
