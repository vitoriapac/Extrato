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
   - **Testes checados:** `tsconfig.tests.json` com `checkJs` incluindo `tests/unit`, para pegar chamadas desatualizadas depois de mudanças de assinatura. Os testes continuam `.js`.
   - **JSDoc redundante:** remover as 52 anotações `@param {…}`/`@returns {…}` dentro de `.ts`; o tipo fica só no TypeScript.
3. **`noImplicitAny` + `noUnusedLocals`/`noUnusedParameters` pasta a pasta:** os flags de código não usado entram junto, para achar código morto como o parâmetro `metrics` de `projectPerformance`.
   **Mecânica de `noImplicitAny`:** cada pasta corrigida entra no `include` do `tsconfig.pure.json`. Ordem: `domain/`, `application/`, `ui/` (maior número de `any`), `demo/` por último.
4. **`strict` gradual:** mesma mecânica, depois do passo 3, num `tsconfig.strict.json` ou no próprio `tsconfig.pure.json`.
5. **Preact montado, uma aba por commit:** trocar `render-to-string` + `innerHTML` e `dangerouslySetInnerHTML` por componentes montados com `mountPreact`. Ordem: questões e calendário (mostram texto digitado), depois revisões, disciplinas, metas, Hoje, Visão Geral, ajuda.
6. **Tailwind junto do passo 5:** a aba convertida usa os utilitários do `@theme` (que já apontam para os tokens) e remove do `app.css` as regras que deixaram de ser usadas, no mesmo commit.
7. **Opcional, só se o hook der trabalho:** trocar os imports `.js` por `.ts` (o `allowImportingTsExtensions` já está ligado) e remover o `scripts/ts-resolve-hook.mjs`, já que o Node 24 executa TypeScript sem ajuda.

## Regras durante a limpeza

- Comportamento visível não muda: cada passo passa no `test:fast`, e cada aba convertida passa nos seus e2e e nas baselines visuais.
- Código novo (verticalizado + ciclo) já nasce como componente montado, tipado com `noImplicitAny` e com Tailwind.
- Commits pequenos; conferir `git status` antes de editar, porque a autora também commita neste repositório.
