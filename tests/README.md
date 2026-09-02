# Testes

Abra `tests/test-runner.html` no navegador. Ele inicia a aplicação com `?test=1`, usa um estado descartável e mostra o relatório sobre a página.

Os testes que usam armazenamento criam chaves prefixadas com `extrato-test-` e as removem ao terminar. O modo de teste não carrega nem salva o estado normal do usuário.

Depois de alterar arquivos em `src/`, gere novamente `src/app.bundle.js` com `build.ps1` antes de executar a suíte.

## Testes E2E

Os fluxos completos usam Playwright e contextos de navegador descartáveis. Nenhum teste E2E reutiliza o perfil ou os dados do navegador pessoal.

```powershell
npm run test:e2e
```

`npm run check:all` executa testes unitários, valida o bundle e executa a suíte E2E. Capturas, vídeos e traces são mantidos somente quando necessários para diagnosticar falhas.
