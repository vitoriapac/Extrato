# Spec: modo-sessao

Primeiro passo de [planilha-morre](ideas/planilha-morre.md). Contém dois módulos pequenos, em ordem de construção: `session-bookmark` (o dado) → `session-pip` (a janela que mostra esse dado). Cada um pode ser entregue e verificado sozinho.

## Objetivo

Quem estuda com o PDF, a videoaula ou o site de questões aberto em outra janela não perde nem o cronômetro de vista nem o ponto onde parou.

Hoje existem dois problemas:
- O timer some assim que a pessoa troca de aba. Depois de 2 h com a aba escondida, o app ainda pergunta se deve descartar o intervalo (`visibilitychange` em `src/app.js`).
- O ponto de parada, como a página do PDF, o minuto da aula ou o artigo da lei, fica só na cabeça de quem estuda, ou na observação livre da sessão.

## Requisitos

### session-bookmark

#### R1 — Um ponto de parada por tópico
`topic.bookmark` é `null` ou:

```js
{ resourceType: 'pdf' | 'video' | 'law' | 'other',
  label: 'Aula 03 - SFN.pdf',  // texto livre, até 120 caracteres, pode ser vazio
  currentUnit: 42,             // inteiro ≥ 0 ou null (página, ou número da aula)
  totalUnits: 110,             // inteiro ≥ currentUnit ou null
  positionText: '',            // até 60 caracteres: "18m30s", "Art. 37, § 6º"
  updatedAt: '2026-10-22T12:00:00.000Z' }
```

- O campo é normalizado em `normalizeTopicStrategy` (`src/state/strategic.js`), que já roda no carregamento, na importação e nas edições de tópico. Tópicos e backups antigos recebem `null`. **Não há bump de `CURRENT_SCHEMA_VERSION` (28)**, porque o campo é opcional e qualquer valor inválido vira `null`.
- Valores inválidos são tratados assim: tipo desconhecido vira `'other'`; `totalUnits < currentUnit` faz `totalUnits` virar `null`. Um bookmark sem `currentUnit`, sem `positionText` e sem `label` vira `null`.
- Sessões sem tópico não têm ponto de parada.

#### R2 — Funções de domínio puras
Ficam em `src/domain/topic-bookmark.js`:
- `normalizeTopicBookmark(raw, {now})`: devolve o objeto acima congelado, ou `null`.
- `bookmarkProgress(bookmark)`: devolve `Math.round(currentUnit / totalUnits * 100)` quando há total, e `null` caso contrário.
- `formatBookmarkLabel(bookmark)`: microcopy curto, em pt-BR:

| Tipo | Exemplo |
|---|---|
| pdf | `PDF · pág. 42 de 110 (38%)` · sem total: `PDF · pág. 42` |
| video | `Videoaula · aula 4 de 12 · 18m30s` |
| law | `Lei seca · Art. 37, § 6º` |
| other | `{label} · {positionText}` |

O `label`, quando existe, substitui o nome do tipo: `Aula 03 - SFN.pdf · pág. 42 de 110 (38%)`.

#### R3 — "Onde você parou?" no check-out
- O modal de conclusão (`#sessionModalOverlay`) ganha a seção recolhível **"Onde você parou?"**, com os campos tipo, material, posição, total e texto da posição.
- A seção só aparece quando há um tópico selecionado. Ela vem preenchida com o bookmark atual do tópico, para que avançar de página seja trocar um único número.
- Ao salvar, se os campos mudaram, o handler `sessionModalSaveBtn` grava `topic.bookmark` normalizado, com `updatedAt` igual a `endedAt` da sessão. Isso acontece **antes** do `persistAndRender()` que já existe, numa única gravação. O caminho do estudo guiado (`guidedStudyService.complete`) segue a mesma regra.
- Campos esvaziados **não** apagam o bookmark. Só um botão "Limpar ponto de parada", na própria seção, faz isso.
- A sessão (`studySessions[]`) **não** guarda cópia do bookmark.

#### R4 — Ponto de parada visível onde se decide estudar
`formatBookmarkLabel` aparece em três lugares quando o tópico tem bookmark:
1. No card de próxima ação da Visão Geral (`renderOverviewNextAction` / `next-best-action-renderer.js`), em uma linha abaixo do tópico: `Continuar de: PDF · pág. 42 de 110 (38%)`.
2. No contexto do modo foco do cronômetro (`renderTimerFocusContext`).
3. Na janela flutuante (R6).

### session-pip

#### R5 — Título da aba como cronômetro (todos os navegadores)
- Enquanto houver sessão iniciada (`hasStartedStudyTimer()`), `document.title` mostra `▶ 24:15 · Português — StudyTrack` quando o timer está rodando, ou `⏸ 24:15 · Português — StudyTrack` quando está pausado.
- Sem disciplina, o título omite o trecho `· Português`.
- O título só é reescrito quando o texto muda. Ao zerar ou salvar a sessão, volta a ser `StudyTrack — Extrato de Estudos`.
- Esse requisito vale sozinho, mesmo sem Document PiP.

#### R6 — Janela flutuante (Document Picture-in-Picture)
- **Disponibilidade:** o botão **"Janela flutuante"** fica junto dos controles do cronômetro e só aparece quando `'documentPictureInPicture' in window` (Chrome/Edge 116+). Nos demais navegadores, o R5 é o fallback, sem canvas e sem vídeo.
- **Abertura:** `documentPictureInPicture.requestWindow({width: 320, height: 200})`. Se a janela já estiver aberta, ela recebe foco em vez de abrir outra.
- **Conteúdo:**
  - disciplina — tópico;
  - linha do bookmark;
  - tempo grande;
  - meta e barra de progresso, quando há `targetMinutes`;
  - etapa da estratégia guiada, quando há uma;
  - botões **Pausar/Retomar** e **Concluir**.
- **Um único timer:** a janela não tem estado próprio. Ela lê o mesmo `state.activeTimer` via `currentTimerSeconds()`, e os botões chamam as mesmas funções `startTimer`, `pauseTimer` e o fluxo do `timerFinishBtn`.
- **Renderização:** a janela é redesenhada por um `setInterval` de 1 s criado **no `pipWindow`**. Esse documento está visível, então não sofre o throttling de aba escondida. Ela também é redesenhada a cada mudança de estado do timer.
- **Concluir:** pausa o timer, fecha a janela e abre o modal de conclusão na aba principal. Se o navegador não trouxer a aba para frente, a mensagem "Volte à aba do StudyTrack para registrar a sessão." aparece na própria janela antes de ela fechar (ver Q1).
- **Tema:** os `<link rel="stylesheet">` e os `<style>` do documento principal são copiados com `href` absoluto. A janela também recebe o `data-theme` atual, então claro/escuro segue o app.
- **Fechamento:** fechar no X (evento `pagehide` do `pipWindow`) só descarta a referência. O timer continua igual. Salvar ou descartar a sessão fecha a janela.

#### R7 — Janela aberta não conta como "aba esquecida"
Enquanto a janela flutuante estiver aberta, o `visibilitychange` não grava `hiddenAt`. Assim, a pergunta de "intervalo em segundo plano por 2 h" não aparece para quem está estudando com a janela visível. A recuperação de execução longa (mais de 4 h em `restoreTimerFromState`) continua valendo.

## Fora de escopo
- Histórico de bookmarks por sessão e mais de um material por tópico.
- Edição inline do bookmark na lista de tópicos.
- Fallback canvas + `<video>` PiP.
- Web Notifications e alerta de troca de etapa.
- Bookmark para sessão sem tópico.
- Atalhos de teclado na janela flutuante.

## Comandos
```
npm test                 # node --test tests/unit/*.test.js
npm run check:types      # tsc -p jsconfig.json --noEmit
npm run build            # regenera src/app.bundle.js, index.html, service-worker.js
npm run check:bundle
npm run test:tiers       # novos arquivos de teste precisam estar em tests/config/test-tiers.json
npm run test:fast
```

## Estrutura
```
src/domain/topic-bookmark.js                  → normalize, progress, label (puro)
src/state/strategic.js                        → normalizeTopicStrategy chama normalizeTopicBookmark
src/ui/controllers/pip-timer-controller.js    → createPipTimerController + buildTimerMiniView (puro) + formatTimerTitle (puro)
src/app.js                                    → seção do check-out, gravação do bookmark, ligações do timer/título/PiP, regra do R7
src/ui/renderers/next-best-action-renderer.js → linha "Continuar de:"
index.html                                    → campos "Onde você parou?" e botão "Janela flutuante"
styles/app.css                                → layout compacto da janela flutuante (classe raiz própria)
tests/unit/topic-bookmark.test.js
tests/unit/pip-timer-controller.test.js
tests/e2e/session-bookmark.spec.js
```

## Estilo
O código segue os arquivos atuais:
- fábricas `createX({deps})` com dependências injetadas, sem tocar em `window` diretamente dentro da lógica testável;
- `Object.freeze` nos objetos retornados;
- textos em pt-BR;
- números formatados como no resto do app (pt-BR).

```js
export function createPipTimerController({pictureInPicture=globalThis.documentPictureInPicture,getView,onToggle,onFinish,copyStyles}={}){
  if(typeof getView!=='function')throw new TypeError('Janela flutuante requer getView.');
  const supported=Boolean(pictureInPicture?.requestWindow);
  // ...
  return Object.freeze({supported,open,close,render,isOpen:()=>Boolean(pipWindow)});
}
```

## Testes
`node:test` em `tests/unit/`, com um `documentPictureInPicture` falso, que devolve um documento falso. No mínimo:

- **R1/R2:**
  - um bookmark válido é normalizado;
  - `totalUnits < currentUnit` vira `null`;
  - tipo desconhecido vira `other`;
  - bookmark vazio vira `null`;
  - strings são cortadas em 120/60 caracteres;
  - o progresso de 42/110 é 38, e sem total é `null`;
  - os quatro formatos da tabela saem corretos;
  - `normalizeTopicStrategy` mantém um bookmark válido e põe `null` em tópico antigo.
- **R3** (e2e, `session-bookmark.spec.js`):
  - iniciar sessão num tópico, concluir com pág. 42/110 e salvar faz a Visão Geral mostrar `Continuar de: PDF · pág. 42 de 110 (38%)`;
  - a próxima conclusão no mesmo tópico abre com 42 já preenchido;
  - esvaziar os campos mantém o bookmark, e "Limpar" o remove.
- **R5:** `formatTimerTitle` cobre rodando, pausado, sem disciplina e sem sessão (título original).
- **R6:**
  - sem suporte, `supported === false` e `open()` não lança;
  - `open()` chamado duas vezes chama `requestWindow` uma única vez;
  - o botão Pausar da janela chama `onToggle`, e Concluir chama `onFinish` e fecha a janela;
  - `pagehide` zera a referência sem chamar `onToggle`;
  - `buildTimerMiniView` monta tempo, meta, progresso, etapa e bookmark a partir do estado.
- **R7:** com a janela aberta, o evento de esconder a aba não grava `hiddenAt`. Isso é testado extraindo a regra numa função pura, `shouldMarkHidden({isRunning, pipOpen})`.

A janela flutuante real não entra no e2e, porque o Playwright headless não abre Document PiP. A verificação dela é manual no Chrome (critério 3).

## Limites
- **Sempre:**
  - um único timer, com a janela apenas lendo e chamando as funções existentes;
  - bookmark normalizado em toda entrada (carregamento, importação, check-out);
  - textos em pt-BR;
  - registrar os testes novos em `test-tiers.json`;
  - rodar `npm run build` antes de commitar.
- **Perguntar antes:**
  - mudar `CURRENT_SCHEMA_VERSION`;
  - guardar o bookmark também na sessão;
  - mexer na CSP;
  - adicionar dependência;
  - pedir permissão de notificação.
- **Nunca:**
  - um segundo `setInterval` que altere o tempo;
  - apagar o bookmark por campo vazio;
  - quebrar a importação de backups antigos;
  - enfraquecer testes existentes.

## Critérios de sucesso
1. Concluir uma sessão com "pág. 42 de 110" faz o card de próxima ação daquele tópico mostrar `Continuar de: PDF · pág. 42 de 110 (38%)`, também depois de recarregar a página.
2. Um backup exportado antes desta mudança importa sem erro e com todos os tópicos em `bookmark: null`.
3. No Chrome:
   - a janela flutuante abre com o timer, que continua andando com outra aba em primeiro plano;
   - Pausar na janela pausa também na aba principal;
   - fechar no X não muda o tempo;
   - com a janela aberta por mais de 2 h, a pergunta de intervalo em segundo plano não aparece.
4. No Firefox, o botão "Janela flutuante" não aparece e o título da aba mostra `▶ mm:ss · Disciplina — StudyTrack`.
5. `npm test`, `npm run check:types`, `npm run check:bundle`, `npm run test:tiers` e `npm run test:fast` passam.

## Decisões (aprovadas em 2026-10-22)
1. Um bookmark por tópico, sobrescrito a cada check-out, sem histórico.
2. Sem bump de schema: o campo é opcional e normalizado no carregamento.
3. Campo vazio não apaga; só o botão "Limpar" apaga.
4. Sem fallback de vídeo PiP; o título da aba cobre os outros navegadores.
5. Q1: "Concluir" fica na janela flutuante, com a mensagem de "Volte à aba do StudyTrack" quando o navegador não trouxer a aba para frente.
6. Q2: vídeo usa `currentUnit` como número da aula e `positionText` como minuto.
7. Q3: "Onde você parou?" começa aberta quando o tópico já tem bookmark, e fechada quando não tem.
