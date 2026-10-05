# Estratégia de validação por risco

## Estado da implementação

Pacotes 1 a 6 concluídos: inventário, contrato, separação das jornadas/matrizes, runners, CI, política de desenvolvimento e seleção por impacto. Nenhum teste foi removido. As matrizes completas permanecem disponíveis no Full. As fórmulas e referências visuais não foram alteradas.

O [inventário](TEST-SUITE-INVENTORY.md) registra 161 arquivos Node, 55 arquivos E2E e evidências da última execução local completa. Integrações existentes usam o runner Node e permanecem em tests/unit.

## Contrato dos gates

Os níveis são cumulativos: Regression inclui Fast; Full inclui Regression. A classificação é independente da camada: um teste Node da Demo pode continuar barato, enquanto uma jornada browser pode carregar a Demo para validar uma decisão importante.

| Gate | Conteúdo contratado | Meta | Máximo |
|---|---|---:|---:|
| FAST_GATE | Sintaxe, artefatos reproduzíveis, todos os Node em UTC/SP e um smoke de navegação sem Demo | 120 s | 180 s |
| REGRESSION | Fast + oito jornadas principais + dois casos responsivos (375 claro / 1440 escuro), browser em UTC | 420 s | 600 s |
| FULL | Sintaxe, artefatos, todos os Node em UTC/SP, todos os E2E em UTC e recorte E2E SP | Monitorar | Sem limite rígido |

Esses valores são orçamentos, não tempos já comprovados para os novos comandos. Instalação de dependências/browser e filas do CI devem ser medidas separadamente. Os unitários levaram 11,5 s em UTC e 16,7 s em SP na última execução; não há motivo medido para reduzir esse conjunto agora.

### Seleção browser da Regression

| Jornada | Arquivo | Contrato principal |
|---|---|---|
| Onboarding | onboarding.spec.js | Configurar prova, disponibilidade e conteúdo; confirmar o primeiro plano |
| Estudo | daily-execution.spec.js | Iniciar atividade, concluir sessão vinculada e atualizar progresso |
| Importação histórica | exam-json-import.spec.js | Prévia, decisão explícita e reimportação sem duplicação |
| Recovery | achievement-projection.spec.js | Confirmar, revalidar, aplicar e registrar sem reescrever sessões |
| Aderência | weekly-adherence.spec.js | Preservar interpretação e pendências no fechamento |
| Backup | backup-schema24-cycle.spec.js | Exportar, limpar, recarregar e restaurar |
| Ciclo estratégico | strategic-cycle.spec.js | Desempenho → Diagnóstico → prévia → confirmação → execução → fechamento |
| Simulado | sessions.spec.js | Encaminhar, salvar resultado e verificar sua leitura em Desempenho |

Além delas, entram o smoke básico e dois casos extraídos para responsive-smoke.spec.js. Os títulos exatos estão no manifesto; selecionar o arquivo inteiro executaria suas matrizes, contrariando o orçamento. A jornada de simulado agora verifica o resultado salvo em Desempenho.

Antes da extração dos casos responsivos, a soma histórica dos 11 casos selecionados era 206,6 s; ela não equivale ao tempo de parede do novo gate, pois os casos podem rodar em paralelo e há preparação. O smoke Fast levou 3,3 s. Os runners medem cada etapa e registram o tempo real, separado da evidência histórica.

## Manifesto e verificação

`tests/config/test-tiers.json` classifica explicitamente todos os arquivos. Arquivos Node são FAST_GATE; arquivos browser têm base FULL e promoções por título exato. Um novo caso browser em arquivo conhecido permanece Full. Um arquivo novo sem classificação provoca erro na verificação. Não existe fallback que elimine testes desconhecidos.

`tests/config/test-tiers.js` fornece classificação e seleção cumulativa para os runners. As seleções não mudam prioridades, fixtures ou o comportamento da aplicação.

```sh
node scripts/audit-test-suite.mjs
node scripts/audit-test-suite.mjs --check
node scripts/check-test-tiers.mjs
```

O primeiro comando regenera JSON e tabela do inventário. O segundo detecta divergência entre inventário e arquivos/imports atuais. O terceiro descobre casos com Playwright `--list` e valida cobertura de arquivos, tiers, títulos únicos, inclusão cumulativa, um único smoke Fast e preservação total no Full. Não inicia browser nem executa as jornadas.

`tests/config/runtime-evidence.json` é evidência histórica vinculada ao commit 4b4fe23, não medição automática da suíte atual. Novas medições devem indicar ambiente, commit, fuso e tempos agregados; não transformar o tempo de um caso em tempo do arquivo ou do gate.

## Proteções que permanecem

- Persistência, backup, migrações, identidade e snapshots históricos.
- Datas locais, limites de dia/semana e execução dos contratos Node nos dois fusos.
- Capacidade, versões do plano, cooldown, invariantes e atomicidade de Recovery.
- Reconciliação de sessões, crédito temporal, prioridade executada e contexto histórico.
- Coerência entre motores e explicitação de evidência insuficiente.
- Sintaxe e reprodução de bundle, HTML e service worker.

A regra matemática deve ser protegida no Node; integração crítica comprova o fluxo entre serviços; jornada browser comprova interação e persistência visível. Uma camada não substitui automaticamente outra.

## Cobertura cara e limitações atuais

A matriz extensa de larguras/temas, Demo densa e cenários complementares permanecem Full por padrão. A Demo browser pode aparecer em Regression quando necessária à jornada de Recovery; a auditoria visual densa completa não entra no Fast. A [seleção por impacto](TEST-IMPACT-SELECTION.md) combina áreas e consumidores transitivos, com fallback Full para contratos compartilhados e arquivos desconhecidos.

Nenhum teste recebeu classificação REMOVE ou CONSOLIDATE sem revisão do contrato. Essas decisões são estados de auditoria, não tiers executáveis. Sobreposições do inventário são candidatas, não prova de redundância. Flakiness permanece não avaliada; uma execução verde não demonstra estabilidade estatística.

Alguns screenshots são condicionados a Windows e ficam sem comparação de pixels no Ubuntu. Full significa todos os testes executáveis para aquela plataforma; não comprova baselines de outra plataforma. A [política visual](VISUAL-TEST-POLICY.md) define Windows/Chromium para os baselines atuais e Ubuntu para verificações estruturais. Não gerar referências automaticamente para esconder falhas.

## Política e execução contextual

A política de desenvolvimento está em [AGENTS.md](../AGENTS.md). A seleção e as métricas são documentadas em [TEST-IMPACT-SELECTION.md](TEST-IMPACT-SELECTION.md).

## Validação do pacote 3

Três E2E direcionados passaram em UTC: simulado com resultado em Desempenho e responsividade em 375 claro/1440 escuro (58,3 s). A descoberta preserva 234 casos Full e 11 Regression. Sintaxe, inventário e seleção foram verificados; a suíte completa não foi executada nesta etapa.

## Comandos e roteamento do CI

```sh
npm run test:fast
npm run test:regression
npm run test:full
npm run test:visual
```

`test:visual` requer Windows e executa as sete superfícies oficiais (50 casos). No Full local em Windows, os screenshots dessas superfícies já fazem parte dos 234 E2E; não é preciso rodá-los novamente. No CI Ubuntu, o job visual Windows separado protege as comparações que antes não eram executadas naquela plataforma.

`check:all` é alias de `test:full`: inclui sintaxe, inventário, contrato, bundle, todos os Node em UTC/SP, 234 E2E em UTC e o recorte de 47 em SP. `npm test`, `test:unit`, `check`, `test:e2e` e `test:e2e:timezone` continuam disponíveis para execução direcionada. Fast/Regression incluem a cobertura da área quando recebem um plano; `test:affected` permite execução direcionada local.

| Evento | Gate |
|---|---|
| Pull request | Fast + impacto; Full para risco global/desconhecido |
| Push em main | Regression + impacto; Full para risco global/desconhecido |
| Release publicada | Full + visual Windows |
| workflow_dispatch | Fast, Regression ou Full selecionado; Full inclui visual Windows |

Mudanças somente em Markdown continuam dispensando validação da aplicação; release e execução manual sempre executam o gate selecionado. Execuções superadas do mesmo evento/ref são canceladas, exceto releases. A execução remota desses workflows ainda depende de envio ao GitHub; a validação local do YAML não comprova que um job remoto passou.

## Funcionamento e falhas

O runner usa Node e caminhos explícitos, sem sintaxe de shell dependente do sistema operacional. Antes de iniciar o browser, `check-test-selection.mjs` descobre a seleção do config Playwright e compara exatamente com o manifesto, protegendo contra títulos duplicados, filtros amplos e seleção vazia.

Cada etapa interrompe o gate ao falhar e propaga seu código de saída. O runner grava `test-results/gate-summary.json`, imprime a tabela de tempos e publica no summary do Actions quando disponível. Instalação, fila e download do browser ficam fora da medição. Exceder o orçamento gera aviso para revisão; não transforma um teste aprovado em erro funcional.

A suíte Full e visual foi validada por descoberta e planejamento (`node scripts/run-test-gate.mjs full --dry-run`), sem executar novamente toda a matriz neste pacote.

## Validação local do pacote 4

| Gate | Resultado | Tempo total |
|---|---|---:|
| Fast, primeira medição | 644 Node em cada fuso + 1 E2E | 37,53 s |
| Fast, validação final | 644 Node em cada fuso + 1 E2E | 42,63 s |
| Regression | 644 Node em cada fuso + 11 E2E | 139,76 s |

Ambiente local Windows/Chromium, dois workers browser. Instalação e fila não incluídas. As duas metas ficaram abaixo dos máximos de 180/600 s nesta medição; o tempo do GitHub Actions ainda não foi confirmado.

Verificações negativas com arquivos temporários isolados confirmaram que sintaxe inválida interrompe o gate na primeira etapa e fonte alterada sem rebuild falha na etapa de artefatos antes dos unitários. As sondas foram removidas e o bundle voltou a ser validado. O YAML foi parseado e os eventos/gates conferidos localmente; a execução remota não foi realizada. Full e visual foram conferidos por descoberta (234 e 50 casos), sem repetir a suíte completa.

## Validação final dos pacotes 5 e 6

Política publicada no commit cb9d275. Fast final: 654 testes Node em cada fuso + um E2E, 38,13 s. Impacto de aderência: 25 arquivos Node em cada fuso + dois E2E, 70,98 s. Seletor direcionado: dez testes Node em cada fuso, 4,94 s. Foram verificados fallback Full, ref inválido, união browser, sintaxe, inventário, bundle e YAML. Full não foi reexecutado, e os resultados são locais.
