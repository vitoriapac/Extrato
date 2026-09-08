# StudyTrack — Extrato de Estudos

[Experimentar o StudyTrack](https://vitoriapac.github.io/Extrato/)

StudyTrack é uma aplicação web para planejar estudos, registrar sessões, organizar revisões e transformar o histórico em recomendações explicáveis. Funciona integralmente no navegador e pode ser instalada como PWA.

## Funcionalidades

- Disciplinas e tópicos com dificuldade, importância para a prova, esforço e pré-requisitos.
- Planejamento semanal e diário baseado na disponibilidade, necessidade e saldo de capacidade.
- Cronômetro, histórico de sessões, questões e simulados.
- Revisões espaçadas, agenda, calendário e replanejamento.
- Índice de prontidão, retenção, domínio, tendências e projeção por faixa.
- Diagnóstico de erros e alertas com motivo e ação recomendada.
- Resultado mensurável das recomendações, comparando métricas antes e depois.
- Relatório estratégico em PDF e backup completo em JSON.
- Modo demonstração isolado com 90 dias de dados fictícios.
- Tema claro/escuro, layout responsivo e navegação por teclado.

## Uso

Acesse a [demo online](https://vitoriapac.github.io/Extrato/) e selecione **Explorar demonstração** para conhecer o fluxo sem alterar seus dados. Para uso pessoal, saia da demonstração e cadastre a data da prova, a disponibilidade semanal, as disciplinas e os tópicos.

Os dados ficam no navegador. Exporte um backup JSON regularmente pela área de dados. A importação valida o formato e a versão antes de substituir o estado local.

## Instalação como PWA

No Chrome ou Edge, abra a versão publicada e use a opção **Instalar StudyTrack** do navegador. O manifest inclui ícones de 192 px, 512 px, maskable e Apple Touch. Depois do primeiro carregamento completo, a aplicação abre offline com o shell armazenado pelo Service Worker.

Quando uma nova versão é publicada, o Service Worker ativa o cache atual e remove caches anteriores.

## Executar localmente

Requer Node.js 22 ou superior.

```powershell
npm install
npm run build
npm run serve
```

Abra o endereço informado pelo servidor. O Service Worker exige HTTP; abrir `index.html` diretamente não habilita instalação ou funcionamento offline.

## Desenvolvimento e validação

```powershell
npm test
npm run test:e2e
npm run check:all
```

`npm run check:all` executa testes unitários, verifica se o bundle é reproduzível e roda os cenários Playwright. Os testes E2E incluem axe para estrutura ARIA, contraste, modal, telas críticas e modo móvel.

O deploy para GitHub Pages ocorre somente após esse gate passar na branch `main`.

## Arquitetura

O projeto usa JavaScript vanilla e separa estado, domínio, aplicação, repositórios, armazenamento e interface. As regras analíticas são puras e versionadas quando seus resultados precisam permanecer auditáveis. Consulte [ARCHITECTURE.md](ARCHITECTURE.md) e [SECURITY-AUDIT.md](SECURITY-AUDIT.md).

`src/app.bundle.js` é gerado pelo esbuild a partir de `src/app.js` e dos módulos importados; não deve ser editado manualmente.

## Privacidade

A aplicação não possui servidor de dados. Sessões, questões, simulados, planos e preferências permanecem no IndexedDB ou no armazenamento local do navegador. A versão publicada no GitHub Pages serve somente arquivos estáticos.

## Relatório e PDF

O relatório estratégico permite escolher o período e reúne planejamento versus execução, desempenho, simulados, revisões, riscos, oportunidades, recomendações e perfil de erros. Use a impressão do navegador para salvar o relatório em PDF no formato A4.

## Modo demonstração

A demonstração usa `sessionStorage` e um cenário fictício separado. Reiniciar ou encerrar a demo não altera a base real do navegador.

## Atalhos

- `Ctrl+K` ou `Cmd+K`: abrir a busca global.
- `1` a `7`: alternar entre as áreas.
- `Esc`: fechar busca, menu ou modal ativo.

## Roadmap

O ciclo atual entregou normalização de sessões, feedback mensurável das recomendações, tendências, diagnóstico de erros, auditoria do planejamento, alertas inteligentes, segurança, acessibilidade, projeção e PWA. Próximos ciclos podem aprofundar cenários de projeção e reduzir gradualmente o código de compatibilidade ainda presente em `src/app.js`.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
