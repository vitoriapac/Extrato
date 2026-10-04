# Superfícies e plataformas de regressão visual

## Plataforma oficial de comparação de pixels

As referências versionadas atuais foram capturadas em Windows/Chromium. Windows é a plataforma oficial dessas comparações até que referências Linux sejam capturadas e revistas em seu próprio ambiente. Não reutilizar PNGs Windows como referência Linux, nem criar baselines por atualização automática no CI.

Ubuntu/Chromium continua validando jornadas, estrutura acessível, valores textuais e overflow. Uma execução verde no Ubuntu não comprova uma comparação condicionada a `process.platform === 'win32'`. O gate Full terá uma etapa Windows específica no CI para as superfícies abaixo; os gates cotidianos não carregam toda essa matriz.

| Superfície | Arquivo | Proteção |
|---|---|---|
| Visão Geral e fechamento | visual-regression.spec.js | Composição principal e leitura do fechamento |
| Próxima ação e diagnóstico | ux-baseline.spec.js | Hierarquia e ação visível |
| Desempenho e Metas | refinement-visual.spec.js | Resumo interpretativo e grupos de metas |
| Trajetória | achievement-projection.spec.js | Gráfico, evidência e distinção observado/tendência |
| Recovery | recovery-preview-ux.spec.js | Prévia comparativa, texto e cancelamento |
| Onboarding | onboarding.spec.js | Quatro etapas, navegação e confirmação |
| Sustentabilidade | planning-sustainability.spec.js | Interpretação, métricas e ação de capacidade |

Os arquivos podem incluir verificações sem screenshot. Comparações visuais existentes em outros arquivos continuam na suíte Full; a tabela define as superfícies centrais da etapa visual Windows, não autoriza remover outras referências. Mudanças nesses PNGs exigem inspeção da imagem real e do diff.

## Responsividade representativa

`responsive-smoke.spec.js` contém apenas 375 px claro e 1440 px escuro. A matriz em `responsive.spec.js` contém as outras oito combinações. Os dois arquivos usam a mesma função `assertCriticalResponsive`; Full executa as dez combinações uma única vez.

Estas verificações avaliam overflow e interação, sem comparação de pixels. A auditoria de dados densos, todos os breakpoints e a matriz completa claro/escuro permanecem no Full.

## Screenshots de diagnóstico

Screenshots em falhas permanecem disponíveis pelo Playwright, junto com traces e vídeos. A captura adicional de sustentabilidade em toda execução bem-sucedida foi retirada; sua referência visual obrigatória foi preservada. Não ampliar a quantidade de snapshots para comprovar uma regra matemática já coberta no Node.
