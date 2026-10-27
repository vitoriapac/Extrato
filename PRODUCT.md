# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

PWA instalável (Chrome/Edge), funciona offline após o primeiro carregamento. Idioma: pt-BR.

## Users

Candidatos a concursos públicos brasileiros que estudam por conta própria, com edital, prova e data definidos. O produto nasceu do uso pessoal da autora e deve servir igualmente a qualquer concurseiro autodidata. O trabalho deles: decidir o que estudar hoje, registrar o que estudaram e saber se estão no caminho certo para a prova.

## Product Purpose

StudyTrack (Extrato de Estudos) planeja estudos semanais e diários a partir da disponibilidade, registra sessões, questões, simulados e revisões, e transforma esse histórico em diagnósticos e recomendações explicáveis. Sucesso é o estudante abrir o app, saber a próxima ação sem esforço, cumprir o plano e entender por que o plano é esse.

## Positioning

A combinação de três coisas, juntas:

1. **Decisões explicáveis.** Toda recomendação mostra Prova × Você × Ação, a qualidade da evidência e seus limites. Nada altera dados sem prévia e confirmação; ajustes são reversíveis.
2. **Inteligência da prova.** Cruza o histórico real de provas da banca (incidência por tópico) com o domínio pessoal para priorizar, e só ajusta o impacto quando há confiança suficiente.
3. **Local e privado.** Tudo roda no navegador, offline, sem conta nem servidor; backup em JSON.

## Operating Context

- Uso diário e em sessões longas: abrir o app, ver "Hoje", estudar com o cronômetro, registrar, voltar ao plano. Fadiga visual em uso prolongado importa.
- Ritual semanal: fechamento da semana, aderência, comparação de períodos, adaptação do plano.
- Primeiro uso: assistente com prova e disponibilidade, depois conteúdo via edital do catálogo, arquivo JSON/CSV ou cadastro manual, sempre com prévia.
- Documentos e artefatos reais: editais do catálogo, provas históricas importadas em JSON, relatório estratégico em PDF, backup JSON.

## Capabilities and Constraints

- Áreas: Visão Geral/Hoje, Disciplinas e tópicos, Planejamento semanal e diário, Revisões espaçadas, Desempenho (questões, simulados, disciplinas, consistência, Inteligência da prova), Diagnóstico, Linha do tempo estratégica, Conquistas, Dados/backup, Central de Ajuda.
- Terminologia fixa: Prontidão, Domínio, Retenção, Aderência, Próxima melhor ação, Fechamento semanal, Recuperação, Adaptação semanal, Trajetória, Prova × Você, Incidência × Domínio.
- Regras de produto que a interface deve preservar: prévia antes de salvar; capacidade semanal nunca aumenta por adaptação (15–40 min, cooldown de 14 dias); retratos históricos congelados não são recalculados; evidência insuficiente é declarada, nunca escondida; recomendações não prometem aprovação nem atribuem causalidade.
- Copy: texto permanente de uma a duas frases; explicações em disclosures fechados, operáveis por teclado ([docs/MICROCOPY-CONTRACT.md](docs/MICROCOPY-CONTRACT.md)).
- Técnica: TypeScript strict (`strict: true`), componentes declarativos Preact (`.tsx`), utilitários sob demanda com Tailwind CSS v4, bundle via esbuild, Service Worker gerado; não editar bundles nem o service worker à mão.
- Roteiro de evolução: histórico consolidado em [Planos Concluídos](docs/PLANOS-CONCLUIDOS.md), backlog ativo em [Próximas Evoluções](docs/PLANO-PROXIMAS-EVOLUCOES.md) e detalhado em [O que falta implementar](docs/O-QUE-FALTA-IMPLEMENTAR.md).

## Brand Commitments

- Nome: StudyTrack — Extrato de Estudos. Metáfora do extrato (de conta) é a identidade existente, registrada em [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- Voz: sóbria, precisa, honesta sobre limites da evidência; pt-BR.
- Ícones do app em `icons/` (192, 512, maskable, Apple Touch).

## Evidence on Hand

- Demo pública: https://vitoriapac.github.io/Extrato/ com modo demonstração isolado (140 dias de dados fictícios, 17 disciplinas, 305 tópicos).
- Não há depoimentos, usuários reais citáveis, métricas de resultado ou aprovações. Não inventar.

## Product Principles

1. Explicar antes de pedir confiança: toda conclusão vem com motivo, evidência e limite.
2. O estudante decide: nenhuma mudança no plano ou nos dados sem prévia e confirmação.
3. Uma prioridade só: recomendação, plano e diagnóstico partem do mesmo cálculo; nada de prioridades paralelas.
4. O passado não é reescrito: histórico e retratos permanecem como foram registrados.
5. Os dados são do estudante: local, offline, exportáveis.

## Accessibility & Inclusion

- Uso diário prolongado: priorizar conforto de leitura e baixa fadiga visual.
- Já evidenciado no repositório: testes axe nos E2E (ARIA, contraste, modal, mobile), tema claro/escuro, navegação por teclado, layout a partir de 320 px sem rolagem horizontal.
