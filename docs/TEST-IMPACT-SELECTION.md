# Seleção por impacto e métricas

## Uso local

```sh
# Arquivos rastreados alterados contra HEAD + novos arquivos de código/testes
npm run test:affected -- --dry-run
npm run test:affected

# Diferença entre commits; paths antigos e novos de renames são considerados
npm run test:affected -- --base origin/main --head HEAD --dry-run

# Área explicitamente escolhida durante desenvolvimento
npm run test:affected -- --files src/application/adherence/build-weekly-adherence.js
```

`--dry-run` calcula e apresenta o plano sem executar testes. Se houver risco amplo, o comando informa gate Full; sem `--dry-run`, executa Full. Não presumir que `test:affected` sempre será barato. Use o plano antes da execução quando o diff incluir contratos compartilhados ou arquivos desconhecidos.

`--files` é uma seleção explícita do desenvolvedor, não uma auditoria do diff inteiro. Ela não substitui o Fast nem a revisão dos demais arquivos alterados. `--base/--head` usa SHAs verificados por Git; sem base, inclui staged/unstaged e novos arquivos nos diretórios de código, infraestrutura e testes. Logs e diretórios temporários antigos fora desse escopo não entram no plano.

## Mapa e dependências

`tests/config/test-impact-map.js` define Recovery, aderência/sustentabilidade, planejamento, desempenho, projeção, inteligência da prova, sessões e Demo, além de visual. Cada área possui padrões de fontes, famílias Node e jornadas promovidas do manifesto.

O seletor combina essas famílias com consumidores Node encontrados por imports relativos transitivos. Essa leitura não é um analisador completo de JavaScript: imports dinâmicos calculados não são resolvidos. O mapa explícito e o fallback Full protegem contra seleção silenciosamente vazia ou desconhecida. Uma dependência nova que atravesse motores deve receber regra compartilhada/Full ou ampliar o mapa e seus testes.

- Node alterado conhecido: executar o próprio arquivo.
- E2E alterado conhecido: executar todos os casos daquele arquivo.
- CSS/ícones: duas verificações estruturais em 375 claro e 1440 escuro; não iniciar toda a matriz de screenshots.
- Contratos de estado/storage/repositorios/core, snapshots de execução, infraestrutura de testes/CI ou arquivo desconhecido: Full.
- Diff indisponível, ref inválido, seleção de área sem cobertura: Full.
- Documentação somente Markdown: sem testes da aplicação.

Os bundles são artefatos derivados somente quando outras fontes mudaram. HTML e service worker só são dispensados do fallback global quando a comparação com a base comprova mudança exclusivamente de revisão gerada. Mudanças reais nesses arquivos, mudanças isoladas de bundle ou comparação indisponível exigem Full. Rebuild continua obrigatório e é verificado pelo runner.

## Integração com os gates e CI

Um plano pode ser combinado com o gate básico:

```sh
node scripts/select-affected-tests.mjs --base origin/main --head HEAD --output .test-gates/review-plan.json
npm run test:fast -- --plan .test-gates/review-plan.json
```

O diretório de saída precisa existir para uso direto do seletor; o runner cria `.test-gates` automaticamente. O arquivo contém caminhos e decisões de seleção, não dados de estudo. Use plano correspondente ao diff atual: `--plan` é uma entrada explícita e não recalcula o diff.

PR usa Fast + casos afetados; main usa Regression + casos afetados. O conjunto browser é a união, sem duplicação. Contratos globais e fallback ampliam ambos para Full. Release/manual continuam usando o gate selecionado. O plano é produzido no job changes e transferido como artifact para validation; ausência/falha desse artifact bloqueia a execução regular.

Antes de iniciar o browser, a descoberta do Playwright verifica exatamente a união esperada, a existência dos arquivos e títulos únicos. Não basta um grep passar sem testes. Planos locais gerados pelo runner recebem nomes únicos para não disputar um arquivo entre execuções.

## Métricas

Cada execução registra:

- gate solicitado e gate efetivamente executado;
- data, commit, estado das alterações rastreadas no checkout, plataforma e versão Node;
- área, arquivos, origem do diff e motivos de ampliação;
- tempo e código de saída de cada etapa;
- tempo total e situação do orçamento, sem incluir instalação/fila.

`test-results/gate-summary.json` contém a última execução. `.test-gates/history.jsonl` acumula as execuções locais e fica ignorado pelo Git. O CI publica a tabela no job summary e envia a medição como artifact. Um orçamento excedido gera aviso de revisão; não mascara falhas funcionais nem prova flakiness. Não comparar máquinas diferentes como se fossem o mesmo benchmark.

## Validação do pacote 6

Os testes Node cobrem padrões de diretório, transitive consumers, união/deduplicação, Recovery, aderência, CSS, arquivos desconhecidos, paths inválidos, diff ausente, renames/deleções, testes alterados e artefatos derivados. Uma ref inexistente foi conferida pelo CLI e selecionou Full.

A descoberta com plano de aderência validou dois casos Affected, três Fast + impacto e onze Regression + impacto. A execução de aderência passou com 25 arquivos Node em cada fuso e dois E2E em 70,98 s. A seleção Full foi conferida por dry-run, sem iniciar a matriz completa. O YAML e a transferência do plano foram verificados localmente; não houve execução remota do GitHub Actions nesta implementação.

O Fast final passou em 38,13 s com 654 Node em cada fuso e um E2E. A execução direcionada dos dez testes do seletor nos dois fusos passou em 4,94 s, sem iniciar browser. O histórico local passou a registrar cada etapa, a decisão de impacto e o estado do orçamento.
