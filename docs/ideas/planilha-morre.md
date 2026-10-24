# StudyTrack: a planilha morre

> Refinamento de [O-QUE-FALTA-IMPLEMENTAR.md](../O-QUE-FALTA-IMPLEMENTAR.md) — 2026-10-22.

## Problem Statement
Como fazer o StudyTrack ser o único lugar onde a concurseira planeja, executa e mede o estudo diário, sem planilha de edital, sem agenda que quebra e sem trocar de janela?

## Recommended Direction
Construir o **verticalizado + ciclo como duas vistas do mesmo dado**. O ciclo responde "o que estudo agora", o verticalizado responde "quanto falta e onde estou fraca". Cada sessão concluída avança o ciclo e atualiza a linha do tópico. O ciclo **evolui o modo `sequence` que já existe** (`src/app.js`, botões Agenda/Sequência) em vez de criar um `'cycle'` paralelo.

Antes disso, entregar o **modo sessão enxuto** (Document PiP + `document.title` + bookmark). É barato, independente e tira o atrito de trocar de janela já na primeira semana.

O **parser de edital** fica para o fim, como experimento do SaaS e com critério de aceite medido em editais reais. Ele estende o importador que já existe em `src/application/subjects/structured-content-import.js`.

## Key Assumptions to Validate
- [ ] **Marcar etapas manualmente é aceitável.** Teoria e resumo acontecem fora do app. Teste: usar o verticalizado por 2 semanas e ver se você marca, ou se ignora a coluna.
- [ ] **O ciclo elimina a culpa, e não só a mecânica.** Teste: depois de faltar um dia, o "Hoje" e a aderência não mostram dívida.
- [ ] **A aderência tem um significado no modo ciclo.** Por exemplo, minutos do ciclo cumpridos sobre a capacidade declarada. Decidir isso antes de codar.
- [ ] **O PiP cobre seu navegador real.** Teste: confirmar que você usa Chrome ou Edge no dia a dia.
- [ ] **O parser acerta 80% ou mais dos tópicos** em 5 editais reais (Banco do Brasil, Caixa, um tribunal, um fiscal, um policial), contando os ajustes necessários na revisão.

## MVP Scope
1. **Modo sessão:** Document PiP com timer, disciplina/tópico, pausar/concluir e fallback no título da aba. O bookmark (`resourceType`, `currentUnit`, `totalUnits`, `positionText`) é perguntado no check-out e mostrado no PiP e na próxima ação.
2. **Verticalizado (só leitura, mais as marcações):** tabela por disciplina com peso, etapas (marcação manual, com sugestão derivada), tempo, acerto, status diagnóstico e ponto de parada. Filtros "pendentes", "peso alto" e "críticos". Ação "Estudar agora".
3. **Ciclo:** o `sequence` vira uma fila persistente com `activeIndex`, gerada dos scores de prioridade e com disciplinas intercaladas. Avança ao concluir uma sessão (85% do alvo). Tem "Pular bloco" e mostra a volta atual. Sem "atraso" no modo ciclo.
4. **Experimento:** `parseRawSyllabusText` passa pela pré-visualização do importador estruturado que já existe.

**Fora do MVP:** rebalanceamento automático do ciclo, edição inline do verticalizado, notificações de etapa e fallback canvas/vídeo do PiP.

## Not Doing (and Why)
- **Simulador "E se?" e reta final** — a prova está a mais de 3 meses e a reta final já existe em `src/domain/planning/adaptive-planning.js`. Retomar quando houver data de prova.
- **Registro de energia/foco** — não é uma dor marcada, e a análise só fica confiável depois de semanas de dados.
- **Backend SaaS, auth e cobrança** — vender antes de a primeira usuária largar a planilha é prematuro. O WebDAV E2EE já cobre o multi-dispositivo.
- **Um modo `'cycle'` novo** — duplicaria o `sequence`.
- **Fallback canvas+vídeo do PiP** — muita complexidade para pouco público. O título da aba basta.
- **Backlog da seção 5** (falsa consolidação, flashcards, matriz incidência × domínio) — são bons, mas competem pelo mesmo foco.
- **CI sharding e typecheck** — não precisam de ideação. Fazer como tarefa de higiene à parte, quando o CI incomodar.

## Open Questions
- O que a aderência e o fechamento semanal mostram no modo ciclo?
- O verticalizado vive em Disciplinas, em Inteligência da Prova ou vira uma aba própria?
- A ordem das etapas (Teoria → Resumo/Lei → Revisão → Questões) é fixa ou configurável por disciplina?
