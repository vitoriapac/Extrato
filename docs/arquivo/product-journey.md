# Jornada do StudyTrack

Este documento registra os cenários de referência da experiência de entrada e execução. Ele é versionado junto ao produto para que mudanças de interface e regras possam ser comparadas com a mesma base.

## Percurso principal

1. Abrir o aplicativo.
2. Definir a data da prova e a disponibilidade semanal.
3. Importar um preset ou cadastrar disciplinas próprias.
4. Conferir a prévia e confirmar o plano.
5. Executar a primeira atividade em **Hoje**.
6. Registrar sessão, questões e resultado.
7. Revisar diagnóstico e recomendações.
8. Analisar a semana e confirmar ou desfazer uma recuperação.

## Cenários de referência

- **Usuário novo:** sem data, sessões ou questões. Deve ver a jornada guiada e chegar a Hoje após a primeira importação.
- **Usuário com histórico:** não deve ver a jornada inicial; sessões, revisões e tópicos permanecem intactos.
- **BB + Caixa:** tópicos comuns mantêm um único identificador e histórico; tópicos específicos obedecem ao concurso ativo.
- **Três faltas:** a recuperação exibe redistribuição, itens mantidos e excedente sem criar uma agenda impossível.
- **Revisões acima da capacidade:** o excedente é declarado e nenhuma atividade concluída é reaberta.

## Medidas mínimas

- quantidade de etapas até o primeiro plano;
- tempo entre a confirmação e o início da primeira sessão;
- minutos não alocados após uma recuperação;
- proporção de recomendações aceitas que geram uma sessão ou registro de questões.

As medidas devem ser calculadas a partir dos registros locais existentes; o produto não envia dados para um servidor.
