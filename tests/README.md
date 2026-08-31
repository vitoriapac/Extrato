# Testes

Abra `tests/test-runner.html` no navegador. Ele inicia a aplicação com `?test=1`, usa um estado descartável e mostra o relatório sobre a página.

Os testes que usam armazenamento criam chaves prefixadas com `extrato-test-` e as removem ao terminar. O modo de teste não carrega nem salva o estado normal do usuário.

Depois de alterar arquivos em `src/`, gere novamente `src/app.bundle.js` com `build.ps1` antes de executar a suíte.
