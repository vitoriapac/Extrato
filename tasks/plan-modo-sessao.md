# Plano: modo-sessao

Spec: [docs/SPEC-modo-sessao.md](../docs/SPEC-modo-sessao.md) · Direção: [docs/ideas/planilha-morre.md](../docs/ideas/planilha-morre.md)

## Componentes e dependências

```
topic-bookmark (domínio puro)  ──►  normalizeTopicStrategy  ──►  check-out (app.js/index.html)  ──►  "Continuar de:" (card + modo foco)
        R1 R2                          R1 carga/import              R3                                  R4
                                                                                                        │
formatTimerTitle (puro) ──► app.js título (R5)                                                          ▼
pip-timer-controller (buildTimerMiniView, controller) ──► app.js botão + ligações + shouldMarkHidden (R6, R7)
```

O módulo `session-bookmark` (tarefas 1–3) pode ser entregue sozinho. O `session-pip` (tarefas 4–6) só depende dele para mostrar a linha do bookmark, e funciona sem ela.

## Ordem

1. **Domínio do bookmark** e normalização no carregamento (R1, R2).
2. **Check-out:** seção "Onde você parou?" e gravação junto com a sessão (R3).
3. **Exibição:** linha "Continuar de:" no card de próxima ação e no modo foco, mais o e2e do fluxo (R4). **Checkpoint:** o `session-bookmark` está completo e pode virar commit.
4. **Título da aba** (R5).
5. **Controller da janela flutuante** com testes de unidade, sem tocar no `app.js` (R6, lógica).
6. **Ligação no app:** botão, Concluir, tema e a regra do `visibilitychange` (R6, R7). Verificação manual no Chrome.
7. **Checkpoint final.**

## Decisões de implementação

- **Onde o bookmark é gravado:** no handler `sessionModalSaveBtn`, antes do `persistAndRender()`. O caminho guiado (`guidedStudyService.complete`) passa pelo mesmo handler, então uma única gravação cobre os dois. O `sessionService` não muda.
- **Gravação do tópico:** é uma mutação direta seguida de `normalizeTopicStrategy(topic)`, o mesmo padrão de `app.js:692`. Não precisa de método novo no `subjectService`.
- **"Mudou?":** compara o bookmark normalizado do formulário com o atual, ignorando `updatedAt`. Se forem iguais, nada é gravado e o `updatedAt` antigo fica.
- **Linha "Continuar de:":** a descoberta na tarefa 3 é se o tópico chega ao `next-best-action-renderer.js` ou só ao `renderOverviewNextAction` (`app.js:4560`). Se for só ao `app.js`, a linha entra lá, e o renderer não muda.
- **Título:** `formatTimerTitle({running, seconds, subjectName, baseTitle})` vive no `pip-timer-controller.js`, porque a janela usa o mesmo texto de tempo. O `app.js` chama a função no `updateTimerDisplay` e restaura o título no `resetTimer`.
- **Ticks da janela:** `pipWindow.setInterval(render, 1000)` chama `getView()`, que lê `currentTimerSeconds()`. O tempo sempre vem dos timestamps, então não há deriva.
- **Concluir na janela:** chama o mesmo fluxo do `timerFinishBtn` (pausar e depois `showSessionModal()`), chama `window.focus()` na aba principal e fecha a janela. Antes de fechar, mostra por 2 s "Volte à aba do StudyTrack para registrar a sessão.", porque não dá para saber se o foco funcionou.
- **R7:** a regra vira `shouldMarkHidden({isRunning, pipOpen})`, exportada do controller e usada no `visibilitychange`.

## Riscos

| Risco | Mitigação |
|---|---|
| **A árvore de trabalho já tem mudanças não commitadas** em `src/app.js`, `index.html`, `styles/app.css`, no bundle e nos testes e2e. Elas se misturariam com as desta feature, e o `npm run build` regenera o bundle por cima de tudo. | Commitar ou guardar (stash) o trabalho atual **antes** da tarefa 1. |
| A CSP (`style-src 'self'`) bloqueia os estilos copiados para a janela, que é um `about:blank` | A janela herda a origem e a política do app. Os links são copiados com `href` absoluto e sem estilo inline. Se mesmo assim bloquear, a regra é parar e perguntar (a spec manda perguntar antes de mexer na CSP). |
| O Playwright headless não abre Document PiP | O controller é testado com uma API falsa, e a janela real é verificada manualmente no Chrome (critério 3). |
| O `app.js` (~5,5 mil linhas) cresce mais | Só as ligações ficam nele. A lógica fica em `topic-bookmark.js` e `pip-timer-controller.js`. |
| `test-tiers.json` e o inventário de testes desatualizados quebram os gates | Registrar cada arquivo de teste novo na tarefa que o cria e rodar `npm run test:tiers`. |

## Checkpoints de verificação

- Após cada tarefa: `npm test` e `npm run check:types` verdes.
- Após as tarefas 3 e 7: `npm run build`, `npm run check:bundle`, `npm run test:tiers` e `npm run test:fast`.
