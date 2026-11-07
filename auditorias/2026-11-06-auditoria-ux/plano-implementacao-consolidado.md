# Plano consolidado de implementação — Extrato de Estudos

**Data:** 06/11/2026  
**Origem:** plano em cinco fases fornecido pelo usuário e [auditoria UX/UI](relatorio.md).  
**Objetivo:** tornar os dados confiáveis, simplificar a primeira experiência e o uso diário, organizar revisões e relatórios e separar a página de vendas da aplicação.

## Endereços e premissas

- `https://extratoestudos.com.br/`: página de vendas independente, com proposta de valor, como funciona, benefícios, perguntas frequentes e CTA **Abrir aplicativo** para `/app`.
- `https://extratoestudos.com.br/app`: aplicação, com acesso direto, atualização da página e navegação funcional. Definir uma URL canônica entre `/app` e `/app/` durante a implementação e testar ambas.
- O domínio acima foi confirmado pelo usuário. `www` deve preservar caminho e destino canônico.
- A rota será no mesmo domínio e origem para preservar acesso aos dados do navegador. Isso não garante por si só compatibilidade do service worker, caches, manifesto ou links: eles precisam ser verificados antes da publicação.
- Há alterações locais em andamento e planos existentes no repositório. Integrar com o estado vigente, sem sobrescrever mudanças alheias ou editar artefatos gerados manualmente.
- As discrepâncias do plano anexado são relatos a reproduzir; até confirmar causa, não são consideradas defeitos de cálculo comprovados. A auditoria desta conversa já incluiu desktop em 1280 px e celular em 390 px, com verificação adicional de largura em 320 px. Outros dispositivos e acessibilidade completa seguem pendentes.

## Prioridade e sequência

**P0:** confiança, perda de dados ou bloqueio de jornada. **P1:** primeira experiência, uso diário e separação de entrada. **P2:** clareza, acessibilidade e melhorias responsivas; um bloqueio confirmado sobe de prioridade. **P3:** refinamento textual e visual. Acessibilidade e mobile acompanham cada entrega, com auditoria complementar na fase final.

| Ordem | Entrega | Prioridade | Dependência |
|---|---|---|---|
| 0 | Levantamento de estado, rotas e dados | P0 | Nenhuma |
| 1 | Validação de tópicos e coerência de prévia, indicadores e acessibilidade | P0 | 0 |
| 2 | Landing page separada e aplicação em `/app` | P1, com preservação de dados P0 | 0; liberar após verificações de migração |
| 3 | Cadastro guiado, importação e prévia | P1 | 1 |
| 4 | Hoje, sessão e planejamento | P1 | 1 e 3 |
| 5 | Agenda, revisões e desempenho | P2 | 1; trabalho visual após contratos claros |
| 6 | Acessibilidade, responsividade e acabamento | P2 | Contínua; revisão final após 2–5 |

Cada item abaixo é uma entrega pequena e revisável; dividir novamente se a investigação revelar alterações em vários motores ou necessidade de migração. Não há estimativas de prazo sem diagnóstico técnico.

## Fase 0 — Preparação e linha de base

**0.1 Inventariar comportamento e implantação.** Mapear entrada atual da landing, aplicação, build, rotas Cloudflare, arquivos estáticos, service worker, manifesto, cache, armazenamento, links profundos e instalações PWA existentes. Registrar o resultado e como iniciar a aplicação localmente. **Aceite:** mapa identifica origem e escopo do armazenamento, geração dos artefatos e comportamento de atualizações; diferenças entre código local e produção ficam explícitas. **Verificação:** inspeção de configuração e experiência em ambiente isolado, com dados fictícios e perfil de navegador limpo e outro com dados anteriores.

**0.2 Reproduzir os relatos do plano anexado.** Registrar passos, dados e resultados para tópico vazio, divergência de 3 versus 35 minutos, contadores da Agenda, descrição acessível de 0/0 e variação de prontidão. **Aceite:** cada caso fica classificado como reproduzido, interpretação esclarecida ou não reproduzido, com causa ainda desconhecida quando aplicável. **Verificação:** cenários em desktop e os trechos pertinentes em mobile; preservar snapshots e dados existentes.

## Fase 1 — Confiança nos dados e estados

**1.1 Tópico válido.** Separar rascunho de tópico válido; aplicar `trim`, excluir nome vazio das contagens, condições do assistente e planejamento; mostrar erro associado ao campo e definir descarte seguro do rascunho. **Aceite:** vazio e espaços não contam; nome válido conta e os tópicos anteriores permanecem íntegros. **Verificação:** casos de domínio e percurso guiado. **Dependência:** 0.2.

**1.2 Prévia e plano.** Rastrear a duração da estimativa, da prévia e do bloco criado para o cenário de uma disciplina, um tópico, 14 h/semana e prazo aproximado de seis meses. Se for defeito, corrigir a origem compartilhada; se forem medidas diferentes, nomeá-las e explicar a relação. **Aceite:** prévia corresponde ao resultado ou justifica claramente a diferença; confirmação nunca cria algo diferente sem indicação. **Verificação:** caso automatizado da causa e comparação antes/depois. **Dependência:** 0.2.

**1.3 Contadores e estados da Agenda.** Definir total, hoje, próximos sete dias, atraso e inclusão de concluídos; compartilhar critérios entre cartões, lista e calendário e explicitar o escopo dos subtotais. **Aceite:** uma revisão pendente, atrasada e concluída aparece nos lugares definidos, sem contagem contraditória. **Verificação:** teste dos estados e fuso civil. **Dependência:** 0.2.

**1.4 Progresso acessível.** Unificar fonte do valor visual e descrição acessível, incluindo “Nenhuma revisão prevista para hoje” quando aplicável. **Aceite:** 0/0, pendente e concluída comunicam o mesmo estado visualmente e na árvore acessível. **Verificação:** casos de estado e inspeção com teclado/leitor de tela. **Dependência:** 0.2.

**1.5 Prontidão.** Investigar o cenário relatado de 45 → 43 e cabeçalho sem valor; alinhar dados e momento de cálculo. Se a queda estiver correta, explicar fatores e confiança no próprio cartão; com evidência insuficiente, indicar índice em formação. **Aceite:** componentes são coerentes, variação é explicável e índice não é descrito como probabilidade de aprovação. **Verificação:** cenários com e sem evidência suficiente, preservando períodos históricos. **Dependência:** 0.2.

**Marco:** reproduzir os casos originais e passar os testes de área antes de construir o redesign sobre esses contratos.

## Fase 2 — Landing page separada e `/app`

**2.1 Definir e construir as entradas.** Criar página de vendas própria na raiz com identidade consistente, benefícios reais, CTA para `/app`, links acessíveis e adaptação mobile; manter aplicação como entrada independente. Revisar o diálogo de apresentação atual para evitar repetir a landing na chegada ao app, preservando boas-vindas e demonstração como caminhos úteis. **Aceite:** `/` apresenta vendas e leva ao app; acesso direto a `/app` abre a aplicação, sem depender da visita à raiz. **Verificação:** navegação em desktop e celular, atualização e URLs diretas. **Dependência:** 0.1.

**2.2 Build, roteamento e deploy.** Ajustar fontes do build, distribuição e regras do Cloudflare para servir entradas corretas e arquivos estáticos; definir canonicalização de `/app`, `/app/` e `www`, com query e fragmento preservados quando aplicável. Revisar links internos, retornos, erros e fallback para rotas relevantes. **Aceite:** build reproduzível; atualização e acesso direto não devolvem landing por engano nem 404; assets carregam corretamente. **Verificação:** build local e ambiente de prévia com smoke tests de URLs. **Dependência:** 2.1.

**2.3 Continuidade de dados e PWA.** Testar com dados reais simulados criados na versão anterior: plano, sessões, revisões, configurações e backup. Planejar atualização segura do service worker, escopo, caches, manifesto, `start_url`, instalações existentes e operação offline. Não mudar origem nem nome/chaves de armazenamento sem migração justificada e testada. Documentar como usuários e favoritos antigos chegam ao app, inclusive PWA instalado apontando para `/`. **Aceite:** após atualização, dados e histórico seguem acessíveis e íntegros; nova instalação abre `/app`; instalação antiga tem caminho de atualização comprovado; operação offline mantém comportamento definido. **Verificação:** upgrade com service worker antigo ativo, recarga online/offline, abertura instalada, backup/restauração e rollback em ambiente isolado. **Dependência:** 2.2.

**2.4 Publicação e retorno seguro.** Preparar verificação das rotas, cache e acesso em ambiente de prévia, sequência de implantação e retorno à versão anterior. **Aceite:** critérios de liberação, monitoramento e rollback estão escritos; preservar dados em ambos os sentidos. **Verificação:** ensaio de atualização e rollback; não pressupor que redirecionamento ou escopo existente seja seguro. **Dependência:** 2.3.

## Fase 3 — Primeiro acesso e cadastro

**3.1 Cadastro manual no assistente.** Incluir disciplina e primeiro tópico no passo “Edital ou matérias”, com adicionar, editar e remover itens antes da confirmação. Manter importação e edição detalhada em Disciplinas; preservar rascunho ao navegar entre passos. **Aceite:** criar disciplina e tópico válidos sem sair do assistente; prévia só habilita com dados válidos. **Verificação:** regressão de vazio, espaços, retorno de etapa e confirmação. **Dependência:** 1.1.

**3.2 Seleção de edital.** Substituir a seleção inicial implícita de 230 tópicos por escolha explícita entre edital inteiro e seleção de matérias, com contagem e efeito visíveis; manter ação para selecionar tudo e resumo antes de importar. **Aceite:** iniciante compreende quantidade a criar e consegue escolher uma disciplina sem limpar centenas de itens manualmente. **Verificação:** edital completo, parcial e seleção vazia, com dados fictícios. **Dependência:** 3.1.

**3.3 Boas-vindas e prévia.** Dar espaço aos cartões, manter “Montar meu plano” como ação principal e identificar demonstração como fictícia. Na prévia, mostrar objetivo/data, capacidade semanal, disciplinas/tópicos, primeiras atividades e tempo alocado; permitir corrigir cada etapa e explicar capacidade versus alocação. **Aceite:** confirmação é a única ação que cria o plano e o sucesso encaminha a “Iniciar primeira atividade”. **Verificação:** percurso completo com data, sem data quando permitido e correção de etapas. **Dependências:** 1.2, 3.1 e 3.2.

**3.4 Lista de matérias.** Explicitar “Mostrando 10 de 18”, mantendo total e ação de expandir compreensíveis; corrigir pluralização como “1 card”. **Aceite:** itens restantes não parecem ausentes e singular/plural corresponde à contagem. **Verificação:** contagens 0, 1 e múltiplas. **Dependência:** nenhuma além da linha de base.

## Fase 4 — Hoje, cronômetro e planejamento

**4.1 Próxima atividade.** Colocar cartão prioritário com matéria, tópico, tipo e tempo, botão Iniciar/Continuar e detalhes secundários. Cobrir sem plano, plano concluído e sessão pausada; manter cronômetro avulso acessível. **Aceite:** ação abre o contexto correto e retomar mostra tempo esperado. **Verificação:** jornada de sessão nova, parcial e retomada em desktop e mobile. **Dependência:** 1.2.

**4.2 Resumo do dia e planejamento.** Usar rótulos consistentes para disponibilidade, plano, estudado, disponibilidade restante e falta no plano; explicar disponibilidade versus alocação. Colocar resumo e próxima decisão no topo e recolher detalhes sem remover filtros ou capacidades. **Aceite:** os valores são coerentes após sessão parcial e não dependem de cor. **Verificação:** cenários sem plano, parcial e concluído; auditoria Demo densa por alterar planejamento. **Dependência:** 4.1.

**4.3 Finalização e questões.** Preservar confirmação antes de salvar; destacar tempo creditado e progresso, oferecendo continuar, registrar questões com contexto preenchido e ver detalhes. Colocar prontidão depois do resultado direto com explicação da fase 1. **Aceite:** tempo aparece corretamente em Hoje/Planejamento; contexto de matéria e tópico acompanha o registro de questões. **Verificação:** iniciar, pausar, salvar, registrar questões e conferir histórico sem duplicação. **Dependências:** 1.5 e 4.1.

## Fase 5 — Agenda, revisões e relatórios

**5.1 Agenda orientada à ação.** Organizar em Hoje, Atrasadas, Próximas revisões, calendário/filtros e histórico. Concluídas deixam a lista de pendentes e permanecem acessíveis no histórico. **Aceite:** contadores, lista e calendário compartilham o estado definido e os vazios são úteis. **Verificação:** criar, concluir e consultar revisão manual e automática. **Dependência:** 1.3.

**5.2 Calendário móvel.** Em 390 px, apenas quatro dias ficaram visíveis no primeiro quadro, com rolagem interna sem sinal claro. Priorizar lista ou semana em telas estreitas; se a grade mensal continuar rolável, indicar deslize e acesso à lista. **Aceite:** todos os dias são descobertos e alcançáveis sem depender de adivinhação, inclusive por teclado. **Verificação:** 320 e 390 px, orientação e leitor de tela; verificar também telas intermediárias. **Dependência:** 5.1.

**5.3 Próximas revisões unificadas.** Mostrar resumo que encaminha para revisões de tópico e flashcards, explicando diferença e mantendo as lógicas de cada fluxo. **Aceite:** cartão agendado e revisão de tópico aparecem como próximos nos contextos corretos, sem duplicar nem alterar dados históricos. **Verificação:** avaliar flashcard e criar revisão manual; conferir contagens e links. **Dependência:** 1.3 e 5.1.

**5.4 Desempenho e relatórios.** Abrir com tempo, questões, precisão com tamanho da amostra, período e leitura curta. Recolher prontidão, trajetória e detalhes; manter filtros, critérios de dados insuficientes e aviso de que projeção não é chance de aprovação. **Aceite:** dados seguem filtros e amostras pequenas não são apresentadas como tendência consolidada. **Verificação:** estados vazio, poucos dados e histórico suficiente, incluindo Demo densa por alterar análises históricas. **Dependência:** 1.5.

## Fase 6 — Acessibilidade e consistência

**6.1 Revisão transversal.** Testar fluxos de entrada, cadastro, plano, timer, questões, revisão e relatórios por teclado; verificar foco visível, entrada e retorno de foco em modal, nomes de ícones, erros associados, anúncios e indicadores sem dependência exclusiva de cor. Medir contraste nos temas claro e escuro. **Aceite:** jornadas principais são operáveis por teclado, descrições refletem os valores e controles modificados atendem WCAG AA. **Verificação:** teclado, ferramenta automatizada e amostra com leitor de tela; registrar limitações.

**6.2 Responsividade e componentes.** Verificar zoom, toque, teclado virtual, modais, navegação e sessão em andamento em 320/390 px e desktop; padronizar botões, cartões, campos, estados vazios, títulos e espaçamento nas primitivas existentes. **Aceite:** ações não ficam escondidas, layouts preservam leitura e mudanças seguem tokens semânticos, temas e ícones Tabler. **Verificação:** jornadas e comparação visual das superfícies alteradas; capturas antes/depois. **Dependência:** ajustes finais após fases 2–5.

## Estratégia de validação e salvaguardas

- Para cada entrega, reproduzir o problema, testar estados vazio/parcial/concluído, preservar dados e conferir navegação por teclado dos controles alterados. Executar testes de área e `npm run test:fast`; para código de domínio/aplicação, executar `npm run check:types`. Classificar novos testes em `tests/config/test-tiers.json` e auditar com `node scripts/check-test-tiers.mjs`.
- Usar Node para regras e serviços; E2E dirigido para jornadas críticas; comparação visual quando a mudança visual justificar. Executar Demo browser densa nas alterações de Demo, planejamento, análises históricas, trajetória ou contratos relacionados.
- Executar `npm run build` quando necessário. Não editar bundles, HTML versionado ou service worker gerados manualmente; alterar suas fontes e reproduzir os artefatos.
- Executar `npm run test:full` em release ou alterações de persistência/migrações, semântica de snapshots, contratos globais ou grande refatoração entre motores. A separação de rotas requer validação específica de upgrade de PWA e dados; se mudar esses contratos, também requer Full.
- Preservar imutabilidade histórica, importações e simulações sem efeitos até confirmação e datas civis pelas utilidades existentes em UTC e America/Sao_Paulo. Novos módulos seguem as fronteiras de domínio, aplicação e UI; não adicionar funções a `src/app.ts`.
- Antes de liberar cada fase: verificar critérios, resultados, tempos e testes não executados; nenhum gate local equivale a confirmação do CI. Para publicação de `/app`, validar instalação antiga, caches e rollback em ambiente de prévia.

## Riscos e decisões pendentes de investigação

| Risco | Medida planejada |
|---|---|
| PWA antigo abre `/` e passa a ver vendas | Testar instalação existente e atualização do manifesto/service worker; oferecer acesso claro ao app e documentar transição antes do deploy. |
| Mudança de escopo do service worker ou cache causa conteúdo incorreto/offline quebrado | Ensaio com versão anterior instalada, cache aquecido e rede desativada; política de atualização e rollback. |
| Armazenamento ou links existentes deixam de funcionar | Permanecer na mesma origem; inventariar chaves e links, testar acesso direto, backup e restauração. |
| Prévia ou prontidão têm semântica distinta em vez de erro | Investigar e documentar causa antes de alterar cálculo; comparar períodos e snapshots. |
| Dados de teste distorcem métricas da auditoria | Usar ambiente isolado ou dados identificados; não apagar dados existentes. |

## Definição de conclusão

O plano termina quando cada entrega aplicável estiver aceita, a landing e `/app` funcionarem por acesso direto e em instalações atualizadas, jornadas centrais forem verificadas em desktop e mobile, e riscos remanescentes e resultados dos testes estiverem documentados. Publicação exige a validação e o processo de release apropriados ao projeto.
