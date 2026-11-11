# Superfícies e plataformas de regressão visual

## Revisão dirigida — resumo de Desempenho

Na revisão da hierarquia do resumo, as quatro referências Windows de Desempenho foram comparadas com as imagens atuais e seus diffs. A conclusão passou para antes dos indicadores; valores, evidências e ressalva sobre probabilidade de aprovação permaneceram. No celular, a captura anterior incluía o cabeçalho fixo sobre o conteúdo. A captura dirigida agora oculta temporariamente elementos flutuantes e aumenta a altura da janela para registrar o resumo inteiro, restaurando ambos em seguida. As quatro imagens foram substituídas individualmente após inspeção; a tolerância continua em 0,08.

## Plataforma oficial de comparação de pixels

Trajetória e Execução de hoje usam o [helper de captura](../tests/e2e/helpers/visual-capture.js) para alinhar temporariamente a origem do recorte ao pixel. Ele mantém dimensões e conteúdo, restaura o estilo após a asserção e não amplia a tolerância. Isso evita que coordenadas fracionárias acrescentem uma linha à imagem. A normalização do recorte em 320 px da trajetória e as três referências de Hoje com microcopy revisada foram inspecionadas junto aos seus diffs antes da atualização.

As referências versionadas atuais foram capturadas em Windows/Chromium. Windows é a plataforma oficial dessas comparações até que referências Linux sejam capturadas e revistas em seu próprio ambiente. Não reutilizar PNGs Windows como referência Linux, nem criar baselines por atualização automática no CI.

Ubuntu/Chromium continua validando jornadas, estrutura acessível, valores textuais e overflow. Uma execução verde no Ubuntu não comprova uma comparação condicionada a `process.platform === 'win32'`. O gate Full terá uma etapa Windows específica no CI para as superfícies abaixo; os gates cotidianos não carregam toda essa matriz.

| Superfície | Arquivo | Proteção |
|---|---|---|
| Visão Geral e fechamento | visual-regression.spec.js | Composição principal e leitura do fechamento |
| Próxima ação e diagnóstico | ux-baseline.spec.js | Hierarquia e ação visível |
| Desempenho e Metas | refinement-visual.spec.js | Resumo interpretativo e grupos de metas |
| Trajetória | achievement-projection.spec.js | Gráfico, evidência e distinção observado/tendência |
| Recovery | recovery-preview-ux.spec.js | Prévia comparativa, texto e cancelamento |
| Central de Ajuda | visual-consolidation.spec.js | Mapa em 375 claro / 1440 escuro, matriz em 375 claro e glossário em 1440 escuro |
| Onboarding | onboarding.spec.js | Quatro etapas, navegação e confirmação |
| Sustentabilidade | planning-sustainability.spec.js | Interpretação, métricas e ação de capacidade |

Os arquivos podem incluir verificações sem screenshot. Comparações visuais existentes em outros arquivos continuam na suíte Full; a tabela define as superfícies centrais da etapa visual Windows, não autoriza remover outras referências. Mudanças nesses PNGs exigem inspeção da imagem real e do diff.

## Responsividade representativa

`responsive-smoke.spec.js` contém apenas 375 px claro e 1440 px escuro. A matriz em `responsive.spec.js` contém as outras oito combinações. Os dois arquivos usam a mesma função `assertCriticalResponsive`; Full executa as dez combinações uma única vez.

Estas verificações avaliam overflow e interação, sem comparação de pixels. A auditoria de dados densos, todos os breakpoints e a matriz completa claro/escuro permanecem no Full.

## Screenshots de diagnóstico

Screenshots em falhas permanecem disponíveis pelo Playwright, junto com traces e vídeos. A captura adicional de sustentabilidade em toda execução bem-sucedida foi retirada; sua referência visual obrigatória foi preservada. Não ampliar a quantidade de snapshots para comprovar uma regra matemática já coberta no Node.

## Revisão dirigida — sustentabilidade em 430 px

No commit c586312, o job visual Windows identificou uma captura de 356 × 512 px para uma referência de 356 × 511 px. A diferença também foi reproduzida localmente. As imagens expected, actual e diff do CI foram inspecionadas: conteúdo, valores e ação permaneceram iguais; o deslocamento vertical alterou a rasterização do texto e produziu aproximadamente 9% de pixels diferentes.

A captura local correspondente foi inspecionada antes da substituição exclusiva de sustainability-430-light-win32.png. A tolerância permanece em 0,08. As outras quatro combinações de sustentabilidade passaram com suas referências existentes. Não houve alteração de CSS ou de cálculos para acomodar o teste.

Após a revisão, o caso de 430 px passou em 37,2 s e o Fast passou em 52,73 s. Full e a matriz visual global não foram executados nesta correção dirigida.

## Consolidação da experiência — captura de sustentabilidade

A superfície de sustentabilidade usa `withPixelAlignedCapture`, já compartilhado pelas capturas do projeto, para evitar coordenadas fracionárias após mudanças na composição da página. Na consolidação dos pacotes 4–6, as referências de 375 px escuro e 430 px claro foram revistas individualmente: expected, actual e diff mantêm conteúdo, métricas e CTA; o recorte alinhado tem uma linha a menos. Somente esses dois PNGs foram substituídos pelas capturas inspecionadas. A tolerância permanece em 0,08; as outras três referências foram preservadas.

## Encerramento da consolidação — aderência

O Full dos pacotes 7–8 identificou cinco referências anteriores ao link “Entenda aderência”. Foram inspecionados expected, actual e diff em 320 claro, 375 escuro, 430 claro e 1440 claro/escuro. As métricas e a interpretação eram iguais; a inclusão do acesso à ajuda deslocou os detalhes abaixo dele. A inspeção também identificou que o botão secundário se esticava no grid desktop: o componente compartilhado agora mantém sua largura pelo conteúdo.

Somente os cinco PNGs `adherence-*-win32.png` de `adherence.spec.js` foram substituídos pelas capturas finais inspecionadas. A tolerância permanece em 0,08. O caso continua verificando teclado, listas progressivas, axe, overflow e isolamento dos registros; a revisão visual não substitui esses contratos.

## Política de coexistência — Preact e Tailwind CSS

Durante a transição para componentes Preact e classes utilitárias do Tailwind CSS:
1. **Sem Preflight global:** O reset global do Tailwind (`Preflight`) permanece rigorosamente desativado (`styles/tailwind.input.css`). Isso impede que regras utilitárias alterem a altura de linha, box-sizing, margens ou fontes de elementos HTML existentes sob `styles/app.css`, evitando qualquer quebra visual de pixels nas superfícies listadas na tabela oficial.
2. **Tokens semânticos:** As classes utilitárias de cores e fontes (`bg-surface-*`, `text-primary`, `font-body`, etc.) mapeiam exclusivamente para variáveis de `styles/tokens.css`, preservando a alternância automática entre os temas claro e escuro.
3. **Validação visual dirigida:** A migração de cada componente para `.tsx` deve preservar os mesmos seletores semânticos (`id`, `data-*`, `role`) e ser inspecionada nas referências visuais oficiais antes de qualquer atualização de snapshots.

## Atualização das referências após o refinamento de interface do branch `fix/theming-drift`

Os alvos de toque e o piso de 24px em `summary` (`ba6918b`, `eff4e3a`), o campo de data da prova com 36px, as faixas laterais de volta à gramática do DESIGN.md (`894e8f5`) e a navegação de Planejamento com "Fechamento semanal · Histórico" deslocaram verticalmente blocos já existentes. As imagens `expected`, `actual` e `diff` foram inspecionadas por família antes da atualização: só houve deslocamento de disclosures, do campo de data e remoção de faixas decorativas, sem mudança de conteúdo. Foram atualizadas as referências de `achievement-projection.spec.js`, `planning-sustainability.spec.js`, `recovery-preview-ux.spec.js`, `ux-baseline.spec.js` e `visual-regression.spec.js`, e depois `help-map-375-light`, `help-map-1440-dark` e `help-matrix-375-light` em `visual-consolidation.spec.js` (só o deslocamento de 2px da faixa removida de `.instruction-example`; esse arquivo fica fora do gate `visual`), e `today-320-light`, `today-375-dark` e `today-430-light` em `daily-execution.spec.js` (o disclosure "Depois" com 44px no celular desloca o rodapé do cartão; também fora do gate), e as cinco capturas `adherence-*` em `adherence.spec.js` (mesmos números; o período passou a `DD/MM/AAAA` e os disclosures cresceram; também fora do gate); as 57 verificações do gate `visual` passaram localmente em Windows/Chromium.

## Atualização das referências após auditoria tipográfica e de contraste (`f1bbf09` / `bf12d2e`)

Após a introdução do piso tipográfico universal de 12px (`--text-micro: .75rem`), do token `--border-control` (> 3:1 WCAG AA), da normalização de `formatDelta()` com sinal de menos tipográfico `U+2212` (`−`) e da remoção do vão da `.sticky-shell` (`top: var(--demo-banner-height, 0px)`), as imagens `expected`, `actual` e `diff` foram inspecionadas individualmente antes da atualização das referências afetadas em `visual-regression.spec.js`, `achievement-projection.spec.js`, `planning-sustainability.spec.js`, `refinement-visual.spec.js`, `ux-baseline.spec.js` e `daily-execution.spec.js`. Todas as 57 verificações do job `visual-windows` e os 4 shards de `validation` passaram no CI (`40891872305`).

## Atualização das referências após typeset e layout pós-crítica (2026-10-31)

A hierarquia de títulos passou a ser título de página (h2, Fraunces `clamp(22px,2.4vw,28px)`) > título de seção (h3, Fraunces `clamp(16px,1.6vw,19px)`, sem maiúsculas) > rótulo mono do card. Os h3 de `performance-block` deixaram o Plex Sans 700, e o extrato da Visão geral ganhou respiro interno mais curto no desktop. As imagens `expected`, `actual` e `diff` foram inspecionadas antes da atualização: só houve troca de estilo dos títulos e deslocamento vertical, sem mudança de conteúdo. Foram atualizadas 15 referências em `adherence.spec.js`, `achievement-projection.spec.js`, `planning-sustainability.spec.js`, `refinement-visual.spec.js` e `visual-regression.spec.js` (Windows/Chromium); as 71 verificações visuais passaram localmente depois disso.

## Atualização das referências após clarify, distill, harden e layout (2026-11-02)

Os rótulos do cabeçalho do extrato (`.balance-label`, `.kpi-cell .l`) subiram para 12px e 80% de `--on-brand` (contraste ≥ 4.5:1), o que desloca o hero; o cartão "Agora" mudou só na renderização do texto. As imagens `expected`, `actual` e `diff` foram inspecionadas antes da atualização: sem mudança de conteúdo. Foram atualizadas `agora-desktop-light` e `agora-mobile-dark` em `ux-baseline.spec.js` e as quatro capturas `hero-*` em `visual-regression.spec.js` (Windows/Chromium).

- 2026-11-02: Visão geral virou resumo visual (KPIs, prontidão, próxima ação e atenção); análise foi para Desempenho e revisões próximas para o Calendário. Baselines atualizados após inspeção: `today-320-light`, `today-375-dark`, `agora-desktop-light`, `agora-mobile-dark`, `hero-mobile-375` e `historico-sessoes-desktop`. Diferença esperada: cartões "Agora/Atenção" mais compactos (títulos "Próxima ação" e "Atenção").

## Revisão dirigida — referências de 30/10 a 07/11/2026

Onze referências Windows estavam defasadas desde 30/10: aderência (4), Hoje (3), sustentabilidade 1440 (2), diagnóstico (2 em `ux-baseline`) e histórico de sessões (1). Expected e actual foram inspecionados em aderência 1440 claro, Hoje 320, sustentabilidade 1440 claro e histórico de sessões; as demais seguem o mesmo padrão de tamanho e tema, e as duas capturas longas de diagnóstico (7.001 e 10.001 px) foram conferidas só por dimensão e pelos testes funcionais. As diferenças vêm do tema Sálvia e da tipografia, de rótulos revisados ("Sua próxima atividade", "Extrato de lançamentos"), do aviso de atividades fora do plano semanal em Hoje e do demo enriquecido em 03/11 (os números da aderência mudaram por isso). Nenhuma tolerância foi alterada. A régua de fases e as porcentagens de consistência perderam `opacity-75` por contraste insuficiente (3,29 e 3,6 contra o mínimo de 4,5).

## Cascata `@layer legacy` e Onda 4 de primitivos (11/11/2026)

Após o encapsulamento integral de `styles/app.css` em `@layer legacy` sob `@layer theme, legacy, components, utilities;` e a migração dos modais restantes para `<Dialog>`, foram corrigidos na raiz os conflitos de precedência em que seletores `.ui-*` (`@layer components`) ou utilitários (`@layer utilities`) alteravam superfícies já cobertas por `@layer legacy`: isolados `.ui-metric-group:not(.performance-kpis)` / `.ui-metric:not(.performance-kpi)` e compensada a largura da caixa de importação em `.ui-dialog--3xl:has(> .exam-import-box)` (`styles/tailwind.input.css`), removido `m-0` de `.performance-kpi-window` (`performance-overview-renderer.ts`), restaurada a moldura única do `.welcome-hero-card` (`NextActionCard.tsx`), preservada a barra de Pareto em 320px (`ErrorParetoChart.tsx`) e garantido contraste `dark:text-accent` em superfícies escuras. Com isso, todas as referências existentes de `refinement-visual.spec.js` (`desempenho-resumo-*`) e `edital-inteligente-desktop.png` permaneceram íntegras sem substituição. Apenas `agora-mobile-dark-win32.png` em `ux-baseline.spec.js` foi substituído após inspeção individual de `expected`, `actual` (`351 × 1632` → `351 × 1613` px) e `diff`, refletindo o espaçamento real de `p-5` e `m-0` de `CockpitSidebarCards.tsx` e os vetores Lucide `1.5px` em `#overviewAttention`; a tolerância permaneceu em 0,08.

## Sincronização das referências Linux do cabeçalho (11/11/2026)

No CI (`43022467536`), todos os 61 testes visuais Windows e os demais casos Linux passaram, restando apenas `hero-mobile-375-linux.png` em [visual-regression.spec.js](../tests/e2e/visual-regression.spec.js) com a referência de 03/11 anterior à inclusão do chip `Fase: Consolidação`, ao cabeçalho `Extrato de Estudos` (`CADA ESTUDO SOMA`) e à remoção dos contadores de inventário no hero (introduzidos em `42831ab`: `351 × 351` → `351 × 386` px no celular). As capturas Ubuntu (`ubuntu-24.04`, `TZ=UTC`) geradas pelo workflow `Generate visual baselines` (`43024734668`) e o diff de falha do CI foram inspecionados para os quatro viewports (`hero-mobile-375-linux.png`, `hero-desktop-1366-linux.png`, `hero-desktop-1440-linux.png` e `hero-desktop-1920-linux.png`) e essas quatro referências Linux foram atualizadas individualmente sem alterar tolerâncias (`0,08`).

## Atualização das referências Windows após adoção da Grade Híbrida de 8 Pontos (11/11/2026)

Após a padronização dos tokens de espaçamento, componentes Preact, renderizadores e estilos na **Grade Híbrida de 8 Pontos** (`8 px` estrutural + `4 px` subgrade micro/óptica, sem frações sub-4pt em UI), os alinhamentos de `padding`, `gap`, `margin` e altura de controle provocaram variações verticais de `1–15 px` nas capturas. Todas as imagens `expected`, `actual` e `diff` com falha foram inspecionadas individualmente antes da substituição das referências Windows abaixo, mantendo tolerâncias inalteradas (`0,08` no gate `visual`, `0,03` em Execução de hoje e `0,02` em Ajuda):

- `visual-regression.spec.js`: `cabecalho-compacto-desktop.png` (`1216 × 42` → `1216 × 46` px pelo `padding: 12px 16px`), `hero-mobile-375-win32.png` (`351 × 386` → `351 × 392` px) e os três viewports desktop `hero-desktop-{1366,1440,1920}-win32.png` (`1216 × 259` → `1216 × 255` px; estas quatro últimas e `cabecalho-compacto-desktop.png` também sincronizam as referências Windows pré-`Extrato de Estudos` / pré-chip de fase e sem ícones de sequência no cabeçalho compacto); `historico-sessoes-desktop.png`, `conquistas-desktop.png`, `erros-categorizados-desktop.png`, `configuracao-estrategica-desktop.png` e `edital-inteligente-desktop.png` permaneceram íntegras.
- `ux-baseline.spec.js`: `agora-desktop-light-win32.png` (`1216 × 689` → `1216 × 687` px) e `agora-mobile-dark-win32.png` (`351 × 1613` → `351 × 1605` px); `diagnostico-desktop-light.png` e `diagnostico-mobile-dark.png` permaneceram íntegras.
- `refinement-visual.spec.js`: `desempenho-resumo-desktop-{light,dark}-win32.png` (`1216 × 539` → `1216 × 541` px), `metas-mobile-{light,dark}-win32.png` (`301 × 2057` → `301 × 2072` px) e `metas-desktop-{light,dark}-win32.png` (`1166 × 936` → `1166 × 932` px; as capturas de Metas também refletem o padrão atual de barras em `--secondary-strong`, precisão em 30 dias `68,7%` e subnavegação sticky de Planejamento em desktop); `desempenho-resumo-mobile-{light,dark}-win32.png` permaneceram íntegras.
- `achievement-projection.spec.js`: `achievement-projection-{320-light,375-dark,430-light,1440-dark}-win32.png` (deslocamento vertical de `−3` a `−4 px` pelos espaçamentos 8pt/4pt sem mudança de conteúdo ou métricas).
- `planning-sustainability.spec.js`: todas as 5 referências `sustainability-{320-light,375-dark,430-light,1440-light,1440-dark}-win32.png` (`−1 px` de altura sem mudança de métricas ou CTA).
- Suítes visuais fora do gate `visual`: `daily-execution.spec.js` (`today-{320-light,375-dark,430-light}-win32.png`, `−2 px` de altura pelo alinhamento de `.btn.small`) e `visual-consolidation.spec.js` (`help-matrix-375-light-win32.png`, `301 × 497` → `301 × 501` px, e `help-glossary-1440-dark-win32.png`, `1120 × 897` → `1120 × 898` px e sincronização com Sálvia e o verbete `Retrato`). `adherence-*-win32.png`, `help-map-*-win32.png`, `recovery-preview-*-win32.png` e `onboarding` permaneceram íntegras.
- As referências `*-linux.png` (`hero-*-linux.png` e `agora-*-linux.png`) não foram alteradas no Windows e devem ser avaliadas/sincronizadas no ambiente Ubuntu do CI se a mudança de altura em `.statement` / `.overview-now-action` divergir no runner Linux.
