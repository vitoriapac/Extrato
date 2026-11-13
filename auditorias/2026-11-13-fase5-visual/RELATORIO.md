# Fase 5 — validação visual e acessibilidade

## Comparação de referências Windows

Foram inspecionados individualmente expected, actual e diff das três capturas alteradas; as tolerâncias não foram modificadas.

- `desempenho-resumo-mobile-light-win32.png` e `desempenho-resumo-mobile-dark-win32.png`: 351 × 794 para 351 × 793 px. Conteúdo, métricas e ressalvas permanecem iguais; há deslocamento de rasterização associado a um pixel de altura.
- `agora-mobile-dark-win32.png`: 351 × 1605 para 351 × 1508 px. A captura reflete a lista de alertas mais concisa e o título e período de tarefas e revisões das fases anteriores; a próxima ação e os indicadores foram preservados.

As três referências foram substituídas pelas imagens inspecionadas e os três casos passaram na repetição. Desktop claro e escuro em Desempenho, ação principal desktop, diagnóstico e testes de estado vazio passaram com as referências anteriores na primeira execução.

## Inspeção dirigida

As quatro imagens `leitura-{320,1440}-{light,dark}.png` registram a nova leitura da preparação com dados fictícios densos. Elementos fixos foram ocultados somente para a captura do bloco; um aviso temporário de salvamento aparece nas imagens móveis. A leitura foi inspecionada nos dois temas e larguras. No botão “Abrir em Hoje”, a navegação por teclado exibiu contorno de 2 px nos dois temas; o alvo mediu 44 px de altura em 320 px e 36 px no desktop. Não houve overflow global nos quatro cenários.

Axe verificou as sete áreas principais em desktop e contraste e nomes acessíveis em 320 px escuro; também foram verificados o modo móvel e um modal. Os testes de responsividade cobriram a matriz crítica em 320 px nos dois temas, 375 px claro e 1440 px escuro. Um seletor antigo de KPIs foi atualizado para a região acessível “Leitura da preparação” após a mudança da fase 4.

## Limites

Não foram verificados zoom real do navegador a 200%, leitor de tela, dispositivo físico ou todos os alvos de toque. A avaliação do estado vazio foi automatizada nas seções de questões, simulados e consistência, não em todas as superfícies. As imagens são capturas Chromium no Windows, não substituem uma auditoria visual integral. Por isso, o item transversal da fase 5 permanece aberto no plano.
