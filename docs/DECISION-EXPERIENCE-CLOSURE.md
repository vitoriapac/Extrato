# Consolidação da experiência de decisão

## Entregas

Os oito pacotes consolidam a narrativa entre Desempenho, Projeção, Diagnóstico, planejamento, execução e fechamento. O [contrato](DECISION-EXPERIENCE-CONTRACT.md) descreve a autoridade de cada superfície e a validação dirigida das entregas anteriores.

- Evidência compartilhada distingue zero medido, ausência, estimativa, amostra insuficiente e contexto não aplicável.
- Projeção começa pelos resultados observados e permite investigar fatores, amostra e limites.
- A atividade do plano mantém o foco operacional; sugestões opcionais têm identificação e tratamento secundário.
- Fechamento separa prioridades concluídas de tempo creditado, apresenta sinal principal e decisão sugerida, com os sinais adicionais acessíveis por detalhes.
- Quatro perfis determinísticos integram os motores existentes: iniciante, intermediário, irregular e reta final. A Demo pública permanece a mesma.

Não foram introduzidos novos scores, regras de prioridade, migrações ou mudanças na persistência. A síntese semanal é transitória; snapshots e comparações continuam seguindo os contratos existentes.

## Pacote 7 — acessibilidade e responsividade

Os detalhes da Projeção e do fechamento têm foco visível. A síntese semanal permite quebra de conteúdo longo sem impor largura mínima à página. Foram reforçadas as verificações existentes de fechamento: abertura por Enter, fechamento por Espaço, manutenção de foco e auditoria axe da superfície.

Os três casos dirigidos de fechamento e responsividade passaram em 1,1 min: 375 px claro e 1440 px escuro. Não foram adicionados casos browser nem ampliado o manifesto Full. As matrizes completas permanecem no gate final.

Axe, nomes acessíveis e interação por teclado são validações automatizadas; não equivalem a uma avaliação manual com leitor de tela. Essa avaliação manual permanece pendente.

## Pacote 8 — fechamento técnico

A validação final está em execução. Registrar o resultado do Full, Fast e CI do commit publicado nesta seção ao concluir o gate. Uma execução local não confirma o GitHub Actions.

As referências Windows alteradas durante o ciclo foram revistas a partir das imagens reais e seus diffs. A correção anterior de sustentabilidade em 430 px claro mantém a tolerância original e corresponde à falha observada no CI de c586312. O primeiro Full também identificou cinco referências antigas de Aderência, anteriores aos perfis determinísticos da Demo e à composição do crédito de estudo. Essas referências foram revisadas; a captura remove temporariamente o menu e botão flutuante, restaurando os mesmos elementos antes das verificações de teclado e axe. A tolerância de 8% foi preservada.

O CI de 9fddcd3 revelou seletores antigos de texto de estudo adicional e de dicas da Ajuda. Os testes foram atualizados para o conteúdo atual. O trace Windows da jornada de aplicação, execução e reversão de Recovery chegou à última asserção antes do timeout global de 60 s; a jornada recebeu orçamento próprio de 120 s, preservando suas verificações e sem acrescentar retries. Fast passou em 56,44 s antes dessas correções exclusivamente browser.

Os artefatos versionados são gerados por npm run build e conferidos por check:bundle. A configuração de CI mantém Node em UTC/São Paulo, seleção por impacto e validação visual Windows no Full. Nenhum gate foi reduzido para acomodar esta entrega.
