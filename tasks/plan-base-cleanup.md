# Plano: limpeza da base pós-migração

Origem: análise de 2026-10-25 (TypeScript, Preact e Tailwind). Decisões da autora: adotar Tailwind aos poucos, tirar o `@ts-nocheck` do `app.ts` e endurecer os tipos pasta a pasta, converter o Preact em string para componentes montados, uma aba por commit.

## Medição de partida

| Item | Valor |
|---|---|
| Erros ao tirar `@ts-nocheck` do `app.ts` (config atual) | 233 (185 × TS2339) |
| `noImplicitAny` no projeto, sem o `app.ts` | 3.590 |
| `strict` no projeto, sem o `app.ts` (com `noImplicitAny` ainda desligado) | 1.085 |
| Módulos com `preact-render-to-string` | 8 |
| `dangerouslySetInnerHTML` | 23 |
| Utilitários Tailwind nos `.tsx` | ~11 |

## Ordem

1. ✅ **Dependência** (`31803c3`): `preact-render-to-string` sai de `devDependencies` e vai para `dependencies` (entra no bundle). Sai de vez no passo 5, quando o último uso acabar.
2. ✅ **`app.ts` tipado** (`8bd680a`): os 233 erros foram corrigidos e o `@ts-nocheck` saiu. O `check:types` passa a cobrir o boot, o carregamento e o salvamento. O JS gerado só mudou em pontos equivalentes.
   - ✅ **Higiene rápida, um commit cada** (`ba47667`, `03a9ed7`, `2c19083`, `793ce70`):
     - `.gitattributes` com `* text=auto eol=lf`, para parar o vai e vem de CRLF/LF nos diffs.
     - Fixar `typescript` e `preact` com `~` ou na versão exata (majors recém-lançadas).
     - Alinhar o `lib` do `tsconfig` com o `target` do esbuild (`es2020`): o TypeScript aceita APIs que o build não traz.
     - Remover a tela de evolução de questões, que é código morto (`renderQuestionEvolution`, `setQuestionEvolutionFilter`, o renderer e o estado `questionEvolutionView`); os elementos dela saíram do HTML em `bec7d42`.
   - ✅ **`state` com tipo real** (feito; o commit traz os números): trocar `let state: any` por `AppState` e descrever as coleções que hoje são `unknown[]` (`calendar`, `reviewAgenda`, `exams`, `examQuestions`, `planningCapacityHistory`...). Medição: 307 erros, sobretudo `date`, `topicId`, `status` e `id`. As funções de normalização (`normalizeStudySession` e similares) definem o formato de cada coleção.
   - ✅ **Testes checados:** `tsconfig.tests.json` (tipos do Node só nele; o `tsconfig.json` do navegador ganhou `"types": []`) roda em `npm run check:types:tests` e na fase "Typecheck (tests)" do gate. 148 dos 187 testes já são checados; 39 ficam no `exclude` (fakes de DOM, retornos em união, entrada inválida de propósito) e saem um a um, como as pastas do `tsconfig.pure.json`.
   - ✅ **JSDoc redundante:** remover as 52 anotações `@param {…}`/`@returns {…}` dentro de `.ts`; o tipo fica só no TypeScript.
3. ✅ **`noImplicitAny` + `noUnusedLocals`/`noUnusedParameters` pasta a pasta:** os flags de código não usado entram junto, para achar código morto como o parâmetro `metrics` de `projectPerformance`.
   **Mecânica de `noImplicitAny`:** cada pasta corrigida entra no `include` do `tsconfig.pure.json`. Ordem: `domain/`, `application/`, `ui/` (maior número de `any`), `demo/` por último.
   - ✅ `core/`, `state/`, `storage/`, `repositories/` e todo o `domain/` (`2dbe869`). Saíram parâmetros mortos: `aggregate` do importador de questões, `topics` do replanejamento pós-simulado, `topic` de `calculateTopicMastery` e `sessions` de `buildWeeklyClose`.
   - **Armadilha:** fazer spread de `Record<string, any>` perde a assinatura de índice, e quem chama perde os campos. Funções que devolvem o registro espalhado usam um genérico com padrão `any` (`<T extends Row = any>`) ou retorno `any` explícito.
   - ✅ Todo o `application/` (`17af591`, nove commits a partir de `d3aab19`).
     - Callbacks de `filter`/`map`/`reduce` sobre arrays que já eram `any` (vindos de `}: any = {}`) ganharam `: any` explícito por codemod.
     - Auxiliares e métodos de serviço receberam tipos de verdade, e tabelas de rótulos montadas inline viraram constantes tipadas.
     - Parâmetros mortos removidos: `addDays` de `reconcileAlerts`, um `Map` sem leitura em `compareRecoveryPlan` e um índice de `forEach`.
   - ✅ Todo o `ui/` (`6662f65`, quatro commits a partir de `d6557bf`).
     - Codemods cobriram três padrões:
       - callbacks e listeners sobre alvos `any`;
       - desestruturações de opções (`: any`, a convenção do projeto para dependências injetadas);
       - lookups em tabelas de rótulos (`Record`).
     - Os parâmetros dos renderers foram tipados pelo papel: `model` e `item` como registros abertos, rótulos como `string`, contagens como `number` e escapes como `(value: any) => string`.
     - Entradas mortas removidas:
       - o `step` de `showMore`;
       - a prop `totalActiveSubjectsCount`;
       - o `escapeHtml` de `renderPerformanceStory`, já que o resumo já escapa;
       - `simulatedScenario`;
       - opções de filtro do calendário que não eram lidas.
   - ✅ `reports/`, `features/`, `demo/` e `bootstrap/` (`bfd664b`, `21e39dc`, `5afc042`).
     - O estado da importação de edital ganhou a interface `ExamImportState`.
     - Os registros fictícios da demo deixam o `any` explícito no valor (`null as any`).
   - ✅ `app.ts` (`57b5eca`, `2c8a9ee`). O `tsconfig.pure.json` cobre todos os arquivos TypeScript de `src/`.
     - Primeiro saiu o código morto que o `noUnusedLocals` revelou: 44 funções sem chamador (helpers antigos de questões, simulados, horas de estudo e notas, já substituídos pelos renderers e view models extraídos) e os 41 imports que só elas usavam. A mensagem do `57b5eca` diz 37, mas a contagem certa é 41.
     - Depois veio a tipagem. Valores lidos do DOM ficam como `any` explícito, e lookups por texto em estado tipado usam cast no ponto do índice.
   - Possível simplificação antes do passo 4: com o pure cobrindo tudo, os três flags podem passar para o `tsconfig.json` e o `tsconfig.pure.json` deixa de existir.
4. ✅ **`strict` gradual:** pasta a pasta num `tsconfig.strict.json` (`f25ea55` … `f1a2063`). Quando ele passou a cobrir tudo, o `strict: true` foi para o `tsconfig.json` e o arquivo à parte saiu. O `tsconfig.tests.json` desliga o `strict` nos testes em JS, que mantêm as checagens explícitas de antes.
   - **Regra seguida:** comportamento igual. Em cada arquivo, o JS sem tipos foi comparado antes e depois. O "possivelmente `null`" foi resolvido de três formas:
     - `!` onde a lógica já garante o valor; o `!` some no JS gerado;
     - `?? 0`, `?? ''` ou `Number()` onde a comparação dependia da coerção de `null`, porque dão o mesmo resultado;
     - tipo de verdade onde a interface era mais estreita que os dados: `SimulationBreakdownItem.subjectId`, as taxas do histórico de recomendações, os itens das tabelas de calendário e revisões, e os campos de `ExamBlueprintSubject` que recebem `null`.
   - **Dívida registrada:** o passo deixou ~512 asserções `!` (eram 6), 222 delas no `app.ts`, a maioria em `document.getElementById(...)`. Cada uma é um `null` assumido, não provado. Próximo passo de qualidade:
     - trocar as buscas no DOM por um helper que falhe com mensagem clara;
     - substituir as demais `!` por guardas reais, arquivo a arquivo e com teste quando mudar comportamento.
5. **Preact montado, uma aba por commit:** trocar `render-to-string` + `innerHTML` e `dangerouslySetInnerHTML` por componentes montados com `mountPreact`. Ordem: questões e calendário (mostram texto digitado), depois revisões, disciplinas, metas, Hoje, Visão Geral, ajuda.
6. **Tailwind junto do passo 5:** a aba convertida usa os utilitários do `@theme` (que já apontam para os tokens) e remove do `app.css` as regras que deixaram de ser usadas, no mesmo commit.
7. **Opcional, só se o hook der trabalho:** trocar os imports `.js` por `.ts` (o `allowImportingTsExtensions` já está ligado) e remover o `scripts/ts-resolve-hook.mjs`, já que o Node 24 executa TypeScript sem ajuda.

## Regras durante a limpeza

- Comportamento visível não muda: cada passo passa no `test:fast`, e cada aba convertida passa nos seus e2e e nas baselines visuais.
- Código novo (verticalizado + ciclo) já nasce como componente montado, tipado com `noImplicitAny` e com Tailwind.
- Commits pequenos; conferir `git status` antes de editar, porque a autora também commita neste repositório.
