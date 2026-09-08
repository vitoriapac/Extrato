# Auditoria de segurança da interface

## Content Security Policy

A versão pública aplica CSP via `meta http-equiv`, compatível com a hospedagem estática do GitHub Pages. Scripts e workers ficam restritos à própria origem; objetos são bloqueados; imagens aceitam apenas origem própria, `data:` e `blob:`; Google Fonts é permitido explicitamente. O GitHub Pages não permite configurar `Content-Security-Policy-Report-Only` por projeto, por isso a política é exercitada no ambiente E2E antes da publicação. `style-src` ainda contém `unsafe-inline` para estilos visuais dinâmicos e atributos legados mapeados nesta auditoria.

Data: 2026-09-07

## Escopo

A auditoria cobriu os 100 usos de `innerHTML` em `src/app.js`, o renderer do relatório e o controlador de eventos delegados. Não há uso de `insertAdjacentHTML`.

## Classificação

- **Seguro/estático:** mensagens vazias, estruturas de layout, métricas numéricas e opções constantes.
- **Escapado:** nomes de disciplinas e tópicos, observações, tags, títulos, motivos e identificadores passam por `escapeHtml()` ou `escapeAttr()` conforme o contexto.
- **Controlado:** fragmentos produzidos por renderers internos recebem modelos já normalizados; o relatório estratégico também escapa campos textuais.
- **Potencialmente perigoso:** nenhum sink conhecido permanece aceitando texto livre sem escape.

## Eventos delegados

O dispatcher aceita somente chamadas simples para handlers próprios da whitelist. Argumentos permitidos são literais de string/número/boolean/null e referências explícitas a `this`. Handlers herdados, objetos, expressões, atributos injetados, caracteres de controle e payloads excessivos são rejeitados.

## Política de manutenção

Todo texto persistido ou digitado deve usar `textContent`, `escapeHtml()` ou criação direta de DOM. Valores de atributos devem usar `escapeAttr()`. Novas ações delegadas precisam ser registradas explicitamente e acompanhadas de teste para payload inválido.
