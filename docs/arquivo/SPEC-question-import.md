# Spec: question-import

Módulo do [mapa de correções](CAPABILITY-MAP-review-remediation.md). Corrige a importação CSV de questões (achados #1, #5, #6, #7, #8, #12 e o modelo CSV de #14).

## Objetivo

Quem estuda importa um CSV (QConcursos, Tec ou modelo próprio) e cada linha válida vira um registro em `state.questoes` com data, disciplina, tópico e categorias de erro **corretos** — ou nada muda e a pessoa vê o motivo. Hoje a importação perde categorias de erro em silêncio, aceita datas impossíveis, quebra planilhas pt-BR separadas por `;` e pode deixar dados pela metade após uma falha.

## Requisitos

### R1 — Categorias de erro na taxonomia do app (#1)
Os valores aceitos na coluna de categoria passam a gravar chaves de `ERROR_CATEGORIES` (`src/app.js:275`):

| Valor no CSV (normalizado) | Chave gravada |
|---|---|
| `lacuna`, `conteudo`, `nao sabia` | `naoSabia` |
| `atencao`, `distracao`, `desatencao` | `desatencao` |
| `interpretacao`, `leitura`, `pegadinha` | `interpretacao` |
| `tempo`, `chute` | `chute` |
| `esqueci` | `esqueci` |
| `calculo` | `calculo` |

- `errorBreakdown` nasce com todas as chaves de `ERROR_CATEGORIES` zeradas — sem lista própria no domínio. Como `ERROR_CATEGORIES` vive em `app.js`, a lista de chaves é injetada no normalizador/serviço (`errorCategoryKeys`), não importada de `app.js`.
- Valor não reconhecido: a linha é importada sem categoria e a prévia mostra "N linhas com categoria de erro não reconhecida (ignorada)".

### R2 — Datas inválidas são rejeitadas (#5)
`parseDate` só aceita datas que existem no calendário: `31/02/2026`, `2026-13-01` e `00/01/2026` geram o problema `invalid_date` na linha.

### R3 — Data padrão local (#6)
Sem coluna de data (ou célula vazia), a data é `todayISO()` do app, injetada no serviço como `today`. O domínio não chama mais `new Date()`.

### R4 — Um delimitador por arquivo (#7)
O delimitador é detectado na linha de cabeçalho (fora de aspas): o mais frequente entre `;`, `,` e tab; empate → `,`. Só ele separa colunas. Assim `Português;Crase, regência;10;8` tem 4 colunas.

### R5 — Importação atômica (#8)
Se qualquer passo de `import` lançar erro, o estado persistente volta exatamente ao de antes (disciplinas, tópicos, questões) e o toast "Nenhum dado foi alterado" passa a ser verdade. Implementação: `app.js` clona `pickPersistentState(state)` antes, restaura no `catch` (mesmo padrão de `applyImportedBackup`) e só então chama `persistAndRender`.

### R6 — Disciplinas e tópicos arquivados (#12)
Correspondência continua ocorrendo com itens arquivados (para não criar disciplina duplicada), mas a prévia avisa: "N registros irão para disciplinas/tópicos arquivados: …".

### R7 — Modelo CSV fora de `app.js` (#14)
O conteúdo e o nome do arquivo do modelo saem de `src/app.js:3374` para `src/features/question-import/` (constante exportada). A data de exemplo usa `today` em vez de `19/10/2026` fixo. O clique continua no mesmo botão (`downloadQuestionsCsvBtn`).

## Fora de escopo
Novos formatos (XLSX), mapeamento de colunas pela interface, mudanças em `ERROR_CATEGORIES`, novo visual da prévia além dos avisos de R1 e R6.

## Comandos
```
npm test                 # node --test tests/unit/*.test.js
npm run check:types      # tsc -p jsconfig.json --noEmit
npm run build            # regenera src/app.bundle.js, index.html, service-worker.js
npm run check:bundle
```

## Estrutura
```
src/domain/questions/question-import-normalizer.js      → parse, datas, delimitador, categorias (puro)
src/application/questions/question-import-service.js    → preview/import contra disciplinas e questões
src/features/question-import/                           → controller, renderer, view-model, modelo CSV
src/app.js                                              → wiring (today, errorCategoryKeys, rollback)
tests/unit/question-import-normalizer.test.js
tests/unit/question-import-service.test.js
```

## Estilo
Seguir o do normalizador existente: funções puras, erros como `problem(line, field, code, message)` acumulados em `QuestionImportError`, mensagens em pt-BR, ESM sem dependências.

```js
issues.push(problem(line, 'data', 'invalid_date', `Data inválida "${rawDate}". Use o formato DD/MM/AAAA ou AAAA-MM-DD.`));
```

## Testes
`node:test` em `tests/unit/`. Um caso por requisito no mínimo:
- R1: cada linha da tabela grava a chave esperada; valor desconhecido conta no aviso; `errorBreakdown` tem exatamente as chaves injetadas.
- R2: `31/02/2026` e `2026-13-01` → `invalid_date`; `29/02/2028` aceito.
- R3: sem coluna de data usa o `today` injetado.
- R4: arquivo `;` com vírgula sem aspas no tópico mantém as colunas; arquivo `,` e TSV continuam funcionando.
- R5: `questionService.create` que lança na 2ª chamada → nenhuma disciplina/tópico/questão nova permanece (teste no serviço com repositórios em memória, ou no wrapper de rollback).
- R6: correspondência com disciplina arquivada aparece no aviso da prévia.

## Limites
- Sempre: rodar `npm test` e `npm run check:types` antes de concluir; manter textos em pt-BR; escapar tudo no renderer.
- Perguntar antes: mudar `ERROR_CATEGORIES`, mudar o formato de `state.questoes`, adicionar dependência.
- Nunca: apagar ou enfraquecer testes existentes para ficar verde.

## Critérios de sucesso
1. Importar `Data;Disciplina;Tópico;Resolvidas;Acertos;Erros;Motivo` com `Crase, regência` e motivo `atencao` grava `errorBreakdown.desatencao > 0` no tópico correto.
2. `31/02/2026` bloqueia a importação com a linha indicada.
3. Uma falha forçada no meio do `import` deixa `pickPersistentState(state)` idêntico ao de antes.
4. `npm test`, `npm run check:types` e `npm run check:bundle` passam.

## Decisões (aprovadas em 2026-10-20)
1. R1, valor desconhecido: a linha é importada sem categoria e a prévia mostra um aviso.
2. R6: apenas avisar; não oferecer restauração da disciplina arquivada.
