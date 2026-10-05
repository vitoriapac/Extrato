# Consolidação da experiência — ciclo iniciado em c28b51d

## Pacote 1 — infraestrutura remota

Experience passa a ser um status independente por impacto no CI, mantendo Fast em PR, Regression no push e Full para contratos globais/release. O plano de impacto explicita `experienceRequired`, com fallback conservador quando não conhece o arquivo ou o diff. O runner grava relatórios JSON por caso e resumo de fusos/tempos; os artefatos não dependem de descobrir manualmente qual jornada falhou.

O [CI anterior de c28b51d](https://github.com/vitoriapac/Extrato/actions/runs/37350737266) terminou com sucesso em 5/10/2026, incluindo validation e visual-windows. A integração nova precisa de publicação e execução remota para ser confirmada. Não confundir teste local com resultado do Actions.

## Pacote 2 — propriedade operacional

A [matriz](INFORMATION-OWNERSHIP.md) especifica proprietário, resumo permitido, destino e chave de contexto. Preserva as superfícies atuais, sem inventar abas Prova/Fechamento ou transferir fatores globais da Prontidão. Cada redução exige comparar entidade, concurso, período, unidade, denominador e fonte.

## Pacote 3 — narrativa de Desempenho

A visão geral mantém os indicadores e até três insights já calculados, apresenta a trajetória atual antes do histórico e oferece investigação por Disciplinas, Questões, Simulados e Consistência. O histórico congelado permanece acessível, assim como comparação, plano e mudanças. As subvisões continuam sendo o detalhe: não copiar todas para a visão geral.

Não há alteração de algoritmo, meta, capacidade, snapshot ou persistência. Os botões reutilizam o controller existente e preservam período/concurso. O resumo mantém suas referências visuais; a auditoria verifica a nova ordem, navegação e overflow em mobile/desktop, claro/escuro.

### Achados e tratamento

| Achado | Tratamento |
|---|---|
| Histórico da Prontidão precedia a trajetória atual | Trajetória promovida, histórico preservado depois da investigação |
| Visão geral tinha números, mas não encaminhava diretamente ao detalhe | Atalhos explícitos para as quatro subvisões, preservando filtros |
| Risco de acumular todas as análises na visão geral | Mantidos quatro indicadores e até três insights existentes; questões e disciplinas ficam nas subvisões |
| Insuficiência pode ser confundida com desempenho ruim | Mantidos os estados vazios orientados e requisitos reais da projeção |
| Atalhos novos competiam com seletores da navegação principal | Atributo próprio `data-performance-investigate`; controller reutiliza a atualização validada de estado |

As quatro comparações Windows de resumo/Metas passaram com os PNGs existentes. Os casos percorrem as seis subvisões e verificam overflow em 375/1440 px, claro/escuro. Isso comprova estrutura e navegação, não uma avaliação humana de compreensão em cinco segundos nem uso manual de leitor de tela.

Os pacotes 4–8 continuam pendentes: padronização analítica mais ampla, revisão das demais superfícies, ciclo/ajuda contextual, cinco perfis da Demo e auditoria final. Full permanece previsto para o encerramento; não é necessário repetir a matriz completa a cada pacote de apresentação.

## Validação local dos pacotes 1–3

- 24 testes Node relacionados passaram (seleção de impacto, contratos de UI/controller e projeção).
- O caso visual desktop claro passou em 30,9 s após a correção de seletor; os outros três passaram em 1,5 min. Nenhuma referência ou tolerância foi alterada.
- Experience final passou em **87,49 s**, incluindo iniciante, Demo, sugestão fora do plano e ciclo estratégico completo.
- Fast final passou em **47,59 s**, incluindo todos os Node nos dois fusos, smoke browser, inventário, sintaxe e artefatos reproduzíveis.
- Build reproduzido. Links locais e diff revisados. Full e avaliação humana com leitor de tela não foram executados nesta etapa.

Os commits destes pacotes estão locais; a aprovação do CI anterior não confirma o workflow modificado até sua publicação.
