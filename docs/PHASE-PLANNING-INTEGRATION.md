# Estratégia por fase e prévia integrada

## Política preservada

Os limites continuam centralizados em EXAM_PHASE_THRESHOLDS: construção acima de 90 dias, consolidação de 31 a 90, reta final de 8 a 30 e revisão final de 0 a 7. Sem data futura válida, não há proposta.

As proporções existentes de teoria, questões e revisão estão em phase-strategy-policy.js. O motor mantém minutos de cada tópico, disciplina, carga e disponibilidade; apenas a divisão de atividades muda. Cobertura baixa e lacuna de alto impacto protegem teoria; baixa retenção reforça revisão. Simulados são agendados separadamente: não se cria uma quarta parcela incompatível com o contrato atual.

O cooldown não é dispensado por mudança de fase. A prévia deve ser revisada e confirmada; sessões, planos diários e versões anteriores continuam preservados.

## Integração e confirmação

build-phase-planning-preview.js reutiliza o motor por fase e recebe a trajetória atual, meta, data, escopo e conteúdo elegível. O contexto é transitório e não altera o plano calculado nem persiste novas coleções. Sem projeção suficiente, a interface explica que usa a fase e os sinais pessoais disponíveis.

O controlador compara novamente esse contexto antes de confirmar. Mudança de meta, data, escopo ou trajetória exige revisão da prévia. Conteúdo arquivado ou fora do escopo bloqueia a proposta. Um novo plano continua sendo confirmado pelo serviço existente; nenhuma decisão modifica automaticamente Hoje, sessões ou planos diários.

## Validação local

Em 4 de outubro de 2026, 60 testes Node relacionados passaram. Fast passou em 47,82 s. Quatro jornadas browser passaram (1,3 min), incluindo Demo, planejamento móvel e ciclo estratégico completo; a jornada móvel foi reexecutada com mudança de meta entre prévia e confirmação e passou em 11,1 s. Os artefatos são reproduzíveis. Full não foi executado: a integração acrescenta contexto transitório, preservando persistência e históricos. Nenhuma nova referência visual foi criada ou atualizada neste pacote.
