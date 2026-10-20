# Capability Map: correções da revisão (sync WebDAV, importação de questões, tipagem)

Aprovado em 2026-10-20. Origem: revisão de código do working tree não commitado (achados #1–#15).

| Module id | Responsabilidade | Achados | Depende de |
|---|---|---|---|
| question-import | Categorias de erro, datas, delimitador CSV, importação atômica, disciplinas arquivadas, modelo CSV fora de `app.js` | #1, #5, #6, #7, #8, #12, #14 (só o modelo CSV) | — |
| remote-sync | Confirmação antes de push sobre nuvem mais nova, upload só do estado persistente, PBKDF2 600k + teto de iterações, aviso http, Basic auth UTF-8, ajuda sobre CORS | #3, #4, #10, #11, #13 | — |
| build-hygiene | Teste quebrado (falta `mount()`), rebuild do bundle, ignorar `src/graphify-out/`, três commits separados | #2, #9 | question-import, remote-sync |

Ordem: question-import → remote-sync → build-hygiene (os dois primeiros editam `src/app.js`, por isso em sequência).

Specs: `docs/SPEC-question-import.md`, `docs/SPEC-remote-sync.md`, `docs/SPEC-build-hygiene.md`.
