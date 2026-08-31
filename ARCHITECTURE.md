# Arquitetura

O aplicativo continua executando inteiramente no navegador e sem dependências externas de JavaScript.

## Estrutura

- `extrato-de-estudos-melhorado.html`: marcação e pontos de montagem da interface.
- `styles/tokens.css`: cores, temas e tokens visuais.
- `styles/app.css`: layout e componentes.
- `src/theme-bootstrap.js`: aplica o tema antes da primeira pintura.
- `src/state/schema.js`: contrato do estado, versões, enums e chaves de armazenamento.
- `src/core/utils.js`: utilidades puras e validações primitivas.
- `src/storage/repository.js`: acesso a IndexedDB, `localStorage` e `window.storage`.
- `src/domain/reviews.js`: regras puras de intervalos e revisões adaptativas.
- `src/app.js`: composição temporária da interface e funcionalidades ainda não extraídas.
- `src/app.bundle.js`: artefato gerado para permitir abertura direta por `file://`.

## Fluxo de dependências

`app.js` pode importar `state`, `core`, `storage` e `domain`. Os módulos inferiores não devem importar a interface nem acessar o estado global da aplicação.

## Gerar o bundle

Após alterar qualquer arquivo em `src/`, execute no PowerShell:

```powershell
.\build.ps1
```

O bundle não deve ser editado manualmente.
