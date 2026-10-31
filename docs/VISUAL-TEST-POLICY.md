# Superfícies e plataformas de regressão visual

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
