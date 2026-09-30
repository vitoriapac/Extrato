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
| Instruções | Seis cards fixos e capítulo selecionado | Assuntos e exemplos do capítulo | Glossário e dúvidas frequentes no capítulo Dados e segurança |

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
- Pacotes 3 a 5: categoria ativa e busca destacada nas Instruções; seções editoriais na Inteligência da Prova; resultado, diagnóstico, foco, comparação e próxima semana em ordem no Fechamento Semanal.
- Pacotes 6 e 7: cabeçalhos compartilhados, notas Info/Dica/Atenção e gráfico de uma série para o histórico do foco, com valores textuais preservados.
- Consolidação Visual 2, pacotes 1 a 3: cabeçalhos compartilhados em comparação, lacunas, decisões, Questões, Simulados, Revisões, configuração estratégica e Matriz Edital × Domínio; auditoria com 15 disciplinas; revisão da ajuda em 320, 375, 390 e 430 px.
- Próxima revisão: reduzir bordas e densidade visual nos módulos ainda não revisados, caso a comparação entre telas confirme o ganho.
- A revisão global de bordas deve ser gradual e orientada por essa classificação. Uma troca indiscriminada de estilos pode apagar a distinção entre ações, análise e evidência.
- Consolidação Visual 2, pacote 7: linhas e divisores internos substituem bordas completas apenas nos módulos analíticos de Questões e Metas. O perfil de erros e a distribuição semanal usam texto e barras, preservando as unidades externas da página.

## Contratos e estados

- `module-heading` reúne título, descrição opcional e ação contextual. Use `module-heading--compact` nas subseções analíticas e `module-heading--section` quando o título divide espaço com uma ação.
- `context-note--info`, `--tip`, `--attention`, `--loading` e `--success` identificam respectivamente contexto, orientação prática, problema, operação em curso e resultado confirmado. O rótulo textual continua obrigatório.
- `ui-state--empty` identifica ausência de dados ou resultado de busca, com texto que indica o próximo passo. Não atribua valores numéricos a dados ausentes.
- Na importação de prova histórica, a leitura exibe estado de carregamento; erro de arquivo exibe atenção; importação concluída exibe sucesso. O estado de carregamento usa `aria-busy`.
- Com a busca da ajuda em foco no mobile, o índice de categorias deixa de ser sticky para não ocupar a área visível acima do teclado. Ao sair da busca, o índice volta a acompanhar a rolagem.

## Auditoria de dados densos

O cenário isolado em `tests/fixtures/visual-density.js` amplia a demonstração para 15 disciplinas, nomes longos, 350 sessões, questões adicionais e histórico BB/Caixa com provas completas e parciais. Ele não altera a demonstração apresentada ao usuário. A auditoria cobre Visão Geral, Disciplinas, Questões, Metas e Instruções nos quatro tamanhos mobile, em light e dark, além dos cabeçalhos em desktop. Os critérios incluem ausência de rolagem horizontal da página, funcionamento do menu Mais, busca, estado sem resultados e posição da categoria após navegar pelo índice.

O [inventário da consolidação de produto](PRODUCT-CONSOLIDATION-VISUAL-AUDIT.md) estende o mapa a Desempenho, Hoje e Diagnóstico. Nesta rodada, a leitura do Diagnóstico distingue conclusão, evidência e metodologia; os KPIs de Desempenho formam uma faixa editorial em vez de uma pilha de cards.
