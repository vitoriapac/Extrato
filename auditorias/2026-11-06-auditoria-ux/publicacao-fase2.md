# Publicação da landing e da rota /app

## Preparação

1. Gerar o pacote com `npm run build:prod`. Confirmar que `dist/index.html` contém a entrada da landing e que `dist/app.html` contém a aplicação. O Cloudflare usa `html_handling: drop-trailing-slash`, servindo `app.html` em `/app` e canonicalizando `/app/`.
2. Publicar primeiro em ambiente de prévia na mesma configuração de assets e conferir `/`, `/app`, `/app/`, parâmetros e fragmentos, incluindo `www`. Não alterar origem, chaves de storage nem o banco IndexedDB.
3. Em perfil isolado, criar backup e dados de teste na versão anterior. Com service worker e cache antigos ativos, atualizar para a prévia, verificar disciplinas, planos, sessões, revisões, configurações e restauração de backup. Conferir aplicativo instalado, atalhos, atualização de cache e abertura offline de `/app` e `/app/`.
4. Conferir navegação por teclado, telas desktop/mobile, rede, console e carregamento de assets. Verificar que a demonstração continua acessível e isolada.
5. Publicar somente após essas verificações e registrar a versão anterior do pacote e sua configuração. Monitorar erros de carregamento e relatos de perda de acesso.

## Retorno

Restaurar o pacote e configuração anteriores no provedor, sem limpar armazenamento do navegador. Abrir online para que o service worker anterior seja reinstalado; conferir acesso aos dados e um backup em perfil de teste. O retorno da versão nova para a antiga com PWA instalado ainda deve ser ensaiado na prévia antes da publicação.

## Evidência local e limites

Os testes locais cobrem abertura da landing, navegação até `/app`, armazenamento na mesma origem, offline, simulação de instalação antiga e substituição de service worker com dados de teste. O servidor local de distribuição aproxima o roteamento do Cloudflare; não substitui uma prévia implantada nem o ensaio de rollback e instalação real em dispositivos.

Na preparação local de 07/11/2026, `npm run build:prod` gerou `dist/` com 32 arquivos e aproximadamente 2,72 MB. Os testes de PWA passaram e uma navegação isolada sobre `dist/` confirmou o acesso da landing ao `/app`, a preservação de uma chave de teste e a recarga offline. O CSS passou a exigir revalidação e a instalação do service worker solicita recarga dos arquivos do pré-cache; a atualização de um navegador real com cache antigo deve ser confirmada na prévia.

O `test:fast` passou em 55,23 s, em UTC e America/Sao_Paulo. O `test:full` não foi concluído: a execução foi interrompida após uma falha de navegador na trajetória de Desempenho. O percurso do teste foi adaptado à seção recolhível e a comparação visual identificou diferenças de layout e conteúdo em 320 px; as imagens foram inspecionadas e nenhuma referência foi atualizada. Reexecutar e concluir o gate, revisar as diferenças de todas as superfícies afetadas e verificar o CI antes de liberar a versão.
