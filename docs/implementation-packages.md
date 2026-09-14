# Pacotes de implementação

Este roteiro transforma as melhorias restantes em entregas incrementais. A ordem reduz risco: primeiro conclui a experiência principal, depois separa a arquitetura, reforça a entrega e somente então amplia os fluxos especializados.

## P1 — Entrada guiada completa — concluído

**Objetivo:** permitir que uma pessoa sem dados chegue ao primeiro plano sem depender de navegação lateral ou conhecimento prévio do produto.

**Escopo:**

- transformar o checklist atual em um fluxo com avançar e voltar;
- reunir concurso e data da prova, disponibilidade, conteúdo e níveis iniciais;
- oferecer cadastro manual ou importação de edital;
- exibir uma prévia de capacidade antes da confirmação;
- preservar escolhas ao voltar entre etapas;
- encaminhar a pessoa para a primeira atividade em **Hoje**.

**Critérios de aceite:** o fluxo funciona com base vazia, não aparece para quem já possui plano ou histórico e mantém dados existentes intactos.

**Status:** entregue com navegação de avançar e voltar, seleção de concurso, data, disponibilidade semanal, importação ou cadastro manual, níveis iniciais, prévia de capacidade e criação dos planos semanal e diário.

## P2 — Importador totalmente modular — concluído

**Objetivo:** remover de `src/app.js` a marcação e as decisões visuais específicas do assistente de importação.

**Escopo:**

- mover todas as etapas do importador para renderers dedicados;
- manter seleção, estado intermediário e contagens no view-model;
- deixar `src/app.js` responsável apenas pela orquestração;
- preservar os seletores estáveis usados pelos testes E2E.

**Critérios de aceite:** importação, cancelamento e reimportação continuam idempotentes; nenhum HTML específico das etapas permanece no orquestrador.

**Status:** entregue. As três etapas são compostas pelo view-model e pelos renderers do recurso; `src/app.js` conserva somente a integração com serviços, estado e navegação.

## P3 — Recuperação explicável — concluído

**Objetivo:** tornar a proposta de replanejamento verificável antes de aplicá-la.

**Escopo:**

- exibir disciplina, tópico, minutos, nova data e motivo de cada item;
- diferenciar revisão urgente, prioridade alta, atividade parcial e excedente;
- apresentar capacidade utilizada e capacidade restante por dia;
- manter confirmação e desfazer como operações explícitas.

**Critérios de aceite:** nenhuma atividade é movida sem aparecer na prévia e a soma dos itens coincide com os totais exibidos.

**Status:** entregue com movimentações individualizadas, motivo, destino, minutos, excedente e conferência do uso e saldo de capacidade por dia.

## P4 — Gate de qualidade e publicação — concluído

**Objetivo:** fazer da mesma validação usada no desenvolvimento o requisito único para publicar no GitHub Pages.

**Escopo:**

- estabilizar os cenários E2E de importação, sessão e troca de concurso;
- revisar e atualizar baselines visuais somente para mudanças intencionais;
- executar o gate em UTC e `America/Sao_Paulo`;
- condicionar o deploy do Pages ao sucesso do pipeline principal;
- guardar trace, screenshot e vídeo quando houver falha.

**Critérios de aceite:** `npm run check:all` passa nas duas zonas de horário e uma falha impede a publicação.

**Status:** entregue com matriz UTC/São Paulo, diagnóstico Playwright preservado em falhas e deploy do Pages condicionado ao sucesso do workflow principal.

## P5 — Ações especializadas das recomendações — concluído

**Objetivo:** fazer cada recomendação abrir a ferramenta apropriada, e não apenas alterar o rótulo do botão.

**Escopo:**

- questões abrem o registro de questões;
- revisão inicia o fluxo de revisão adaptativa;
- pré-requisito abre a seleção do bloqueador;
- replanejamento abre a prévia de recuperação;
- estudo inicia uma sessão vinculada à recomendação;
- manter resultado posterior e motivo de troca.

**Critérios de aceite:** cada tipo cria o registro correto e mantém vínculo auditável com a recomendação de origem.

**Status:** entregue. Questões, revisões e pré-requisitos possuem destinos próprios; estudo mantém o cronômetro guiado e cada decisão registra o tipo e o vínculo criado.

## P6 — Fechamento semanal aplicável — concluído

**Objetivo:** transformar o diagnóstico semanal salvo em decisões que possam ser avaliadas e aplicadas com segurança.

**Escopo:**

- aceitar ou recusar prioridades individualmente;
- verificar capacidade antes de alterar o plano;
- mostrar o impacto proposto antes da confirmação;
- aplicar apenas as prioridades aceitas;
- ampliar o histórico versionado de fechamentos e decisões.

**Critérios de aceite:** o plano só muda após confirmação, nunca excede capacidade silenciosamente e preserva o snapshot que originou a decisão.

**Status:** entregue com seleção individual, prévia de impacto, verificação de capacidade, aplicação confirmada e vínculo ao snapshot versionado.

## Evoluções posteriores

Depois dos seis pacotes, as próximas entregas podem ser tratadas separadamente:

- prioridade de tópicos com edição e explicação mais ricas;
- cenário demonstrativo determinístico com 130 dias;
- importação estruturada em JSON e CSV;
- gamificação discreta e opcional;
- camada explicativa com IA, condicionada a backend, privacidade e gestão de chaves;
- interpretação automática de PDF, somente após o importador estruturado.

## Sequência de versões sugerida

| Versão | Pacote | Resultado principal |
| --- | --- | --- |
| 3.2 | P1 | primeiro uso completo |
| 3.3 | P2 | importador desacoplado |
| 3.4 | P3 | recuperação explicável |
| 3.5 | P4 | publicação protegida pelo gate |
| 3.6 | P5 | recomendações com ações próprias |
| 3.7 | P6 | fechamento semanal aplicável |
