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

1. **Dependência:** `preact-render-to-string` sai de `devDependencies` e vai para `dependencies` (entra no bundle). Sai de vez no passo 5, quando o último uso acabar.
2. **`app.ts` tipado:** corrigir os 233 erros e remover o `@ts-nocheck`, em commits por grupo de erro. O `check:types` passa a cobrir o boot, o carregamento e o salvamento.
3. **`noImplicitAny` pasta a pasta:** cada pasta corrigida entra no `include` do `tsconfig.pure.json`. Ordem: `domain/`, `application/`, `ui/` (maior número de `any`), `demo/` por último.
4. **`strict` gradual:** mesma mecânica, depois do passo 3, num `tsconfig.strict.json` ou no próprio `tsconfig.pure.json`.
5. **Preact montado, uma aba por commit:** trocar `render-to-string` + `innerHTML` e `dangerouslySetInnerHTML` por componentes montados com `mountPreact`. Ordem: questões e calendário (mostram texto digitado), depois revisões, disciplinas, metas, Hoje, Visão Geral, ajuda.
6. **Tailwind junto do passo 5:** a aba convertida usa os utilitários do `@theme` (que já apontam para os tokens) e remove do `app.css` as regras que deixaram de ser usadas, no mesmo commit.

## Regras durante a limpeza

- Comportamento visível não muda: cada passo passa no `test:fast`, e cada aba convertida passa nos seus e2e e nas baselines visuais.
- Código novo (verticalizado + ciclo) já nasce como componente montado, tipado com `noImplicitAny` e com Tailwind.
- Commits pequenos; conferir `git status` antes de editar, porque a autora também commita neste repositório.
