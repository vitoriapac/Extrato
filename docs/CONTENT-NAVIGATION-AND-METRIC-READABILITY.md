# Navegação de conteúdo e leitura dos indicadores

## Disciplinas

A busca local combina nome da disciplina e do tópico, ignora acentos e cruza os termos digitados. Atua junto ao concurso ativo no filtro da tela e aos filtros independentes de status e dificuldade por disciplina. Mostra contagem de disciplinas encontradas e tópicos filtrados por grupo.

A consulta é transitória e permanece ao navegar para Hoje e voltar. Filtros por disciplina continuam no estado de visualização existente. Resultados da busca ficam abertos temporariamente, sem mudar a preferência de recolhimento gravada; enquanto há busca o botão de recolher fica desativado. Fora da busca, os grupos possuem botão acessível por teclado, com aria-expanded e aria-controls. A regra Mostrar mais permanece.

## Tempo e revisões

format-study-time.js arredonda apenas a apresentação para minutos inteiros e usa horas/minutos, preservando zero, ausência e sinal de variação. O resumo e a tabela de Desempenho, a atividade por disciplina e a composição do crédito usam o formato humano. Detalhes analíticos que precisam de precisão mantêm seus valores numéricos. Não há alteração de denominadores ou fórmulas.

O contador de atrasos do Calendário mantém o total existente e discrimina itens de Calendário e Agenda de Revisões. A origem já fazia parte do modelo unificado: nenhuma revisão foi criada, removida ou fundida. Escopos e períodos continuam nos cabeçalhos de análise existentes; os módulos analíticos não foram removidos.

## Validação

Node cobre busca combinada, apresentação de tempo, origem dos contadores e imutabilidade. Browser usa Demo densa em 390 px, navegação de ida e volta e uma comparação visual dirigida do resumo de Desempenho. Full e matriz visual completa não foram executados nesta tarefa. Artefatos gerados são reproduzidos pelo build.
