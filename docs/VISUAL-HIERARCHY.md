# Hierarquia visual do StudyTrack

Este documento orienta as próximas revisões de interface. Ele classifica o conteúdo existente pelo papel que exerce na decisão de estudo; não altera cálculos nem determina que cada nível precise de um card.

## Três níveis de informação

| Nível | Pergunta respondida | Tratamento visual |
| --- | --- | --- |
| A — decisão | O que preciso fazer ou revisar agora? | Título claro, sinal principal legível à primeira vista e uma ação dominante. Reservar o contraste mais forte da área. |
| B — análise | Por que essa decisão faz sentido e como ela evoluiu? | Seções com títulos e divisores; gráficos e comparações com contraste intermediário. |
| C — evidência | Quais dados, fontes e limites sustentam a análise? | Texto e metadados discretos, mas legíveis; acesso próximo da conclusão correspondente. |

Confiança e ausência de dados não devem ser escondidas apenas para simplificar a tela. Elas pertencem ao nível C, salvo quando mudam a interpretação da decisão: nesse caso, o aviso sobe para junto do nível A.

## Mapa das áreas atuais

| Área | A — decisão | B — análise | C — evidência |
| --- | --- | --- | --- |
| Visão Geral | Próxima melhor ação, foco da semana, alerta principal e Índice de Prontidão | Evolução, disciplinas, retenção e fechamento semanal | Histórico de decisões, fatores e confiança das métricas |
| Hoje | Recomendação e atividade a executar | Diagnóstico e prioridades do dia | Sinais, resultados posteriores e justificativas |
| Disciplinas | Próximo tópico ou ação no conteúdo | Progresso e estado dos tópicos | Sessões, questões, revisões e configurações por tópico |
| Metas e planejamento | Proposta confirmável e capacidade disponível | Distribuição, plano até a prova e comparação entre períodos | Premissas, déficits, histórico e origem dos impactos |
| Inteligência da Prova | Prova × Você e lacuna estratégica | Saúde da base, configuração × histórico e tópicos de maior impacto | Cobertura, confiança, questões classificadas e importação de evidências |
| Fechamento Semanal | Resultado, diagnóstico e próxima ação | Foco estratégico e comparação com períodos anteriores | Tempos, lacunas medidas, amostra e limites da inferência |
| Instruções | Comece por aqui e fluxo Prova × Você → ação | Seções do guia e exemplos | Glossário e dúvidas frequentes |

## Regras para a implementação visual

1. Cada área deve ter uma leitura principal. Acrescentar uma métrica a um bloco existente quando ela explica a mesma decisão; criar um bloco novo somente quando introduz uma decisão independente.
2. Usar espaço e divisor para separar subseções. Reservar fundo ou borda completa para unidades realmente independentes, ações críticas ou avisos.
3. Um módulo deve ter título, descrição curta e, quando necessário, uma ação associada. A mesma hierarquia tipográfica deve funcionar em 375 px e em desktop.
4. Usar notas com parcimônia: **Info** para contexto, **Dica** para prática útil e **Atenção** para limite ou risco. Cor sozinha não comunica o tipo de nota.
5. Dados históricos ou estimados nunca devem receber o mesmo rótulo de um peso oficial. Confiança e escopo por concurso acompanham os números que qualificam.
6. No mobile, preservar a ordem A → B → C e favorecer leitura vertical; não compactar vários indicadores em uma linha que exija decodificação.
7. Em light e dark, conferir contraste do texto secundário, estados de foco, divisores, barras e notas. O foco de teclado não pode ficar oculto por navegação fixa.

## Aplicação por pacote

- Pacote 2: corrigir a pilha de navegação e o ritmo editorial das Instruções.
- Pacotes seguintes: indicar categoria ativa e refinar a busca; reduzir cards aninhados da Inteligência da Prova; equilibrar o Fechamento Semanal; consolidar cabeçalhos e notas entre módulos.
- A revisão global de bordas deve ser gradual e orientada por essa classificação. Uma troca indiscriminada de estilos pode apagar a distinção entre ações, análise e evidência.
