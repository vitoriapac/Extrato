# Estratégia de validação por risco

## Estado da implementação

Pacotes 1 e 2 concluídos: inventário e contrato de classificação. Os scripts de execução e o GitHub Actions ainda usam a configuração anterior. `test:fast`, `test:regression` e `test:full` serão introduzidos no pacote 4; não são comandos disponíveis nesta etapa. Não houve remoção de testes, alteração de fórmulas, baselines ou redução do CI atual.

O [inventário](TEST-SUITE-INVENTORY.md) registra 159 arquivos Node, 54 arquivos E2E e evidências da última execução local completa. Integrações existentes usam o runner Node e permanecem em tests/unit.

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
| Simulado | sessions.spec.js | Encaminhar sessão ao cadastro próprio de resultado |

Além delas, entram o smoke básico e dois casos existentes de responsive.spec.js. Os títulos exatos estão no manifesto; selecionar o arquivo inteiro executaria suas matrizes, contrariando o orçamento. O pacote 3 deve revisar se o registro de resultados e sua leitura em Desempenho precisam de uma jornada mais completa antes da ativação dos gates.

A soma histórica dos 11 casos selecionados é 206,6 s; ela não equivale ao tempo de parede do novo gate, pois os casos podem rodar em paralelo e há preparação. O smoke Fast levou 3,3 s. As metas só poderão ser confirmadas após os runners do pacote 4.

## Manifesto e verificação

`tests/config/test-tiers.json` classifica explicitamente todos os arquivos. Arquivos Node são FAST_GATE; arquivos browser têm base FULL e promoções por título exato. Um novo caso browser em arquivo conhecido permanece Full. Um arquivo novo sem classificação provoca erro na verificação. Não existe fallback que elimine testes desconhecidos.

`tests/config/test-tiers.js` fornece classificação e seleção cumulativa para os futuros runners. As seleções não mudam prioridades, fixtures ou o comportamento da aplicação.

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

A matriz extensa de larguras/temas, Demo densa e cenários complementares permanecem Full por padrão. A Demo browser pode aparecer em Regression quando necessária à jornada de Recovery; a auditoria visual densa completa não entra no Fast. A seleção baseada na área modificada será implementada no pacote 6, com ampliação conservadora para contratos compartilhados e arquivos desconhecidos.

Nenhum teste recebeu classificação REMOVE ou CONSOLIDATE sem revisão do contrato. Essas decisões são estados de auditoria, não tiers executáveis. Sobreposições do inventário são candidatas, não prova de redundância. Flakiness permanece não avaliada; uma execução verde não demonstra estabilidade estatística.

Alguns screenshots são condicionados a Windows e ficam sem comparação de pixels no Ubuntu. Full significa todos os testes executáveis para aquela plataforma; não comprova baselines de outra plataforma. O pacote 3 deve definir as superfícies e plataformas visuais oficiais. Não gerar referências automaticamente para esconder falhas.

## Próximos pacotes

3. Separar jornadas/matrizes e revisar a cobertura visual e de resultados.
4. Implementar runners, medir orçamentos e configurar PR/main/release/manual no CI.
5. Publicar política de execução durante desenvolvimento em AGENTS.md.
6. Selecionar por impacto e registrar duração por etapa, sem excluir arquivos desconhecidos.
