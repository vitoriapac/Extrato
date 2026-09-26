# Testes

Abra `tests/test-runner.html` no navegador. Ele inicia a aplicação com `?test=1`, usa um estado descartável e mostra o relatório sobre a página.

Os testes que usam armazenamento criam chaves prefixadas com `extrato-test-` e as removem ao terminar. O modo de teste não carrega nem salva o estado normal do usuário.

Depois de alterar arquivos em `src/`, execute `npm run build` para atualizar o bundle, `index.html` e o service worker antes de executar a suíte.

## Testes E2E

Os fluxos completos usam Playwright e contextos de navegador descartáveis. Nenhum teste E2E reutiliza o perfil ou os dados do navegador pessoal.

```powershell
npm run test:e2e
```

`npm run check:all` verifica a sintaxe JavaScript, executa testes unitários, confere os artefatos gerados contra o build e executa a suíte E2E. Para publicar, execute `npm run build` antes do gate e inclua os artefatos gerados no commit. A verificação de sintaxe não substitui uma futura configuração de lint semântico. Capturas, vídeos e traces são mantidos somente quando necessários para diagnosticar falhas.

O gate de publicação roda `check:all` em UTC e `America/Sao_Paulo` no CI. Ele cobre o ciclo da recomendação até a sessão, planejamento adaptativo, histórico e resultados posteriores, Command Palette, relatório PDF e regressão visual. A matriz responsiva verifica 320–430 px nos temas claro e escuro. Falhas de screenshot exigem inspeção visual antes de atualizar a imagem de referência.

## Matriz de estabilidade da inteligência da prova

| Cenário | Verificação |
| --- | --- |
| Estado vazio e dados demo | Fluxos E2E de recomendação vazia e demo |
| Backup antigo e schema atual | Migração em `legacy-backup.spec.js`; ciclo exportar → limpar → recarregar → restaurar em `backup-schema24-cycle.spec.js` |
| BB, Caixa TBN, Caixa TI e escopo conjunto | Fixture determinística de 16 provas e testes de escopo |
| Prova parcial/completa e classificação manual | Qualidade, matriz, auditoria e importação histórica |
| Histórico insuficiente/suficiente | Impacto efetivo e prioridade nos testes de integração |
| Reimportação | Identidade estável e preservação das classificações revisadas |
| Planejamento com e sem redistribuição | Capacidade semanal, proposta e cooldown |
| Foco semanal e PDF | Mesmos candidatos e evidências do escopo ativo |

Os testes de integração e de backup exercitam esta matriz sem gravar no perfil real do navegador. Alterações em regras estratégicas devem atualizar o cenário correspondente antes de publicar.
