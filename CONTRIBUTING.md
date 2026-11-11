# Contribuindo

1. Crie uma branch a partir de `main`.
2. Mantenha regras de negócio fora da camada de DOM sempre que possível.
3. Adicione testes para correções e novas regras e mantenha os contratos de tipos atualizados em `src/core/types.ts`.
4. Execute `npm run format`, `npm run check:types`, `npm run build` e `npm run check`.
5. Não edite `src/app.bundle.js` ou `src/exam-catalog.bundle.js` manualmente.
6. Não inclua backups, históricos pessoais ou credenciais no repositório.
7. Ao mudar primeiro uso, planejamento, execução, recuperação, recomendações ou persistência, confira os diagramas Mermaid do [README](README.md) e da [arquitetura](ARCHITECTURE.md). Eles devem descrever o comportamento implementado, não o roadmap.
8. Novos componentes de interface devem utilizar os primitivos Preact em `src/ui/primitives/*.tsx` e utilitários semânticos do Tailwind CSS conectados aos design tokens (`styles/tokens.css`), preservando a política de não utilizar Preflight global e nunca adicionar funções em `src/app.ts`.
9. Modais, diálogos e planilhas móveis devem usar `<Dialog>` ou `<BottomSheet>` em Top Layer (`<dialog>` nativo) organizados em `src/ui/modals/` ou `src/ui/components/`, sem introduzir novos overlays `.modal-overlay` estáticos em `index.html`.
10. Respeite a cascata CSS `@layer theme, legacy, components, utilities;`: estilos reutilizáveis `.ui-*` dos primitivos pertencem ao `@layer components` de `styles/tailwind.input.css`; `styles/app.css` mantém apenas o legado em um bloco único `@layer legacy` (com `@keyframes` no nível raiz) sem duplicar regras `.ui-*`.
11. Toda iconografia deve usar exclusivamente vetores **Lucide Icons (`1.5px`)** via `<Icon />` / `renderIconSvg(...)` (gerados por `node scripts/generate-lucide-icons.mjs`), com zero emojis Unicode ou valores `#hex` soltos em JSX/CSS.

Pull requests devem explicar o comportamento alterado, os riscos de migração de dados e como a mudança foi verificada.
