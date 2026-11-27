const BASE_HELP_CATEGORIES: any[] = [
  {
    id: 'guide-start',
    title: 'Comece por aqui',
    summary: 'Da prova ao primeiro fechamento semanal, um passo de cada vez.',
    entries: [
      {
        id: 'first-steps',
        title: 'Primeiros passos',
        summary: 'O caminho básico para começar a receber orientações úteis.',
        steps: [
          {
            title: 'Configure sua prova',
            detail: 'Escolha o concurso, a data e as informações estratégicas.',
          },
          { title: 'Monte o edital', detail: 'Cadastre ou importe disciplinas e tópicos.' },
          {
            title: 'Defina sua disponibilidade',
            detail: 'Informe o tempo que você realmente pode estudar.',
          },
          {
            title: 'Registre seus estudos',
            detail: 'Vincule sessões aos tópicos sempre que possível.',
          },
          {
            title: 'Resolva questões e faça revisões',
            detail: 'O desempenho e a manutenção do conhecimento ganham contexto.',
          },
          {
            title: 'Acompanhe o diagnóstico',
            detail: 'Veja riscos, lacunas e a força das evidências.',
          },
          {
            title: 'Siga as recomendações',
            detail: 'Veja a Sugestão do diagnóstico, com base na prova e no seu progresso.',
          },
          {
            title: 'Faça o fechamento semanal',
            detail: 'Compare o plano com o que foi executado.',
          },
        ],
        paragraphs: [
          'Você não precisa configurar tudo de uma vez. Comece pela prova, pelo conteúdo e pela disponibilidade. Conforme registra sessões, questões e revisões, o Extrato de Estudos personaliza as análises.',
        ],
        action: { label: 'Abrir Disciplinas', target: 'subjects' },
      },
      {
        id: 'overview',
        title: 'Visão Geral',
        summary: 'Seu painel diário de decisão e ritmo.',
        paragraphs: [
          'Começa por A prova hoje: faixa projetada (do cenário baixo ao alto) comparada à meta ou ao corte, com a confiança e o acerto em questões dos últimos 30 dias quando ele destoa dos simulados, disciplinas abaixo do mínimo no último simulado e pendências atrasadas, cada uma levando à aba onde se age. Depois vêm Próxima ação, Tarefas e revisões da semana, Fase atual da preparação, Resumo dos últimos 7 dias, Consistência e Saúde do Edital. A Leitura do Extrato fica na barra da aba Hoje. As análises detalhadas de evolução e matriz ficam na aba Desempenho, e as conquistas ficam em Hoje > Conquistas.',
        ],
        action: { label: 'Abrir Visão Geral', target: 'overview' },
      },
    ],
  },
  {
    id: 'guide-areas',
    title: 'Estudar',
    summary: 'Disciplinas, sessões, Questões & Simulados, revisões e Plano de hoje.',
    entries: [
      {
        id: 'today-guide',
        title: 'Hoje',
        summary: 'Ciclo de Estudos, plano do dia, compromissos com ações contextuais e Conquistas.',
        paragraphs: [
          'Na aba Hoje você alterna entre o Ciclo de estudos (padrão) e a Agenda do dia. No topo da barra assistente ficam o próximo bloco do ciclo com gráfico de donut por disciplina e atalhos para Estudo Rápido ("Tenho X minutos"), Leitura do Extrato e Diário de Aprendizagem.',
          'Na coluna lateral, o painel Agenda e revisões destaca os compromissos de hoje sem duplicar simulados planejados, oferecendo ações diretas por tipo: Registrar resultado para simulados, Iniciar ou Concluir tarefa para redações e tarefas, e Ver detalhes para eventos.',
          'O progresso considera disciplina, tópico e tipo: teoria não conclui uma tarefa de questões, e concluir um compromisso da Agenda não cria horas fictícias no histórico. A subaba Conquistas reúne marcos desbloqueados sem interferir nas prioridades.',
        ],
        action: { label: 'Abrir Hoje', target: 'today' },
      },
      {
        id: 'study-cycle-guide',
        title: 'Ciclo de Estudos e Gráfico de Donut',
        kind: 'feature',
        summary: 'Fila rotativa por disciplina com blocos de 15 a 120 minutos e divisão visual em donut.',
        keywords: ['ciclo de estudos', 'sequência flexível', 'donut', 'blocos', 'adaptativo', 'equilibrado'],
        concepts: ['ciclo de estudos', 'fila rotativa', 'gráfico de donut'],
        questions: ['Como funciona o Ciclo de Estudos?', 'O que o gráfico de donut mostra?'],
        paragraphs: [
          'O Ciclo de Estudos organiza suas matérias em uma fila circular de blocos de 15 a 120 minutos. Se você não puder estudar em um dia, o ciclo apenas pausa e retoma exatamente de onde parou, sem gerar falsos atrasos no calendário.',
          'O gráfico de donut exibe em tempo real a proporção de minutos e o número de blocos de cada disciplina nos modos Adaptativo (ponderado por peso no edital e lacunas), Equilibrado (igual por matéria) ou Manual (ordem personalizada).',
        ],
        bullets: [
          'Confirmar uma nova versão do ciclo preserva voltas e sessões anteriores.',
          'Se o diagnóstico apontar prioridade urgente fora da fila, você pode estudá-la direto pela Leitura do Extrato sem perder sua posição no ciclo.',
        ],
        action: { label: 'Abrir Hoje', target: 'today' },
      },
      {
        id: 'copilot-and-journal',
        title: 'Leitura do Extrato, Estudo Rápido e Diário',
        kind: 'feature',
        summary: 'Respostas auditáveis, blocos curtos para imprevistos e registro qualitativo.',
        keywords: ['leitura do extrato', 'copiloto', 'orientação guiada', 'estudo rápido', 'tenho x minutos', 'diário de aprendizagem'],
        concepts: ['leitura do extrato', 'estudo rápido', 'diário de aprendizagem'],
        questions: ['Como a Leitura do Extrato decide o que estudar?', 'Para que serve o Diário de Aprendizagem?'],
        paragraphs: [
          'A Leitura do Extrato responde perguntas práticas ("O que estudar agora?", "Tenho 30 minutos", "Como foi minha semana?", "Por que meu ciclo sugere X?") usando somente seus dados locais, sem alterar planos automaticamente.',
          'O Estudo rápido monta uma sessão de 15, 30, 45 ou 60 minutos aproveitando revisões atrasadas, prioridade ou bloco do ciclo. O Diário de Aprendizagem registra dúvidas, energia e dificuldade por sessão, permitindo transformar uma dúvida em revisão agendada.',
        ],
        action: { label: 'Abrir Hoje', target: 'today' },
      },
      {
        id: 'subjects',
        title: 'Disciplinas e tópicos',
        summary: 'Estrutura de conteúdo, Edital Verticalizado e importação.',
        paragraphs: [
          'Cada disciplina reúne tópicos com metas de domínio, incidência e vínculo com questões e revisões. Além da lista padrão, você pode alternar para o Edital Verticalizado (checklist por etapas: teoria, resumo, questões e revisão) ou usar o Importador de Edital Bruto / PDF para estruturar matérias e tópicos rapidamente.',
        ],
        bullets: [
          'Tags identificam em quais concursos cada tópico aparece.',
          'O concurso ativo define o escopo padrão das análises.',
          'Clique em Ficha Inteligente no Edital Verticalizado para ver ponto de parada, última sessão, caderno de erros e próximo passo do tópico.',
          'Registros apenas da disciplina permanecem no histórico, mas não são atribuídos automaticamente a um edital específico.',
        ],
        action: { label: 'Cadastrar conteúdo', target: 'subjects' },
      },
      {
        id: 'calendar-guide',
        title: 'Agenda: Mês, Semana, Lista, Redações e Simulados',
        summary: 'Centralize tarefas, simulados, redações especializadas, eventos e revisões com controle de carga.',
        keywords: ['agenda', 'calendário', 'semana', 'redação', 'simulado', 'sobrecarga', 'ics'],
        paragraphs: [
          'A Agenda reúne revisões espaçadas e atividades personalizadas (Tarefa, Simulado, Redação, Evento e Revisão livre) nas visões Mês, Semana e Lista, com criação rápida por dia, arrastar e soltar com Desfazer e exportação .ics.',
          'Ao cadastrar ou editar uma atividade, o sistema calcula a carga do dia e exibe um aviso não bloqueante caso o tempo reservado ultrapasse sua disponibilidade configurada. Eventos oficiais (como data da prova) ficam protegidos e não viram pendência atrasada.',
          'Redações contam com tema proposto, etapa (A fazer, Entregue ou Corrigida), nota opcional e painel próprio de Histórico e evolução de redações, mantendo o lançamento da nota independente da conclusão da tarefa.',
        ],
        action: { label: 'Abrir Agenda', target: 'calendar' },
      },
      {
        id: 'sessions',
        title: 'Cronômetro e sessões',
        summary: 'Registre o estudo real, com ou sem cronômetro.',
        paragraphs: [
          'Escolha disciplina, tópico e tipo de estudo, registre a duração e finalize a sessão. Também é possível lançar uma sessão manual e vincular resultados posteriores. Prefira informar o tópico: isso melhora a precisão do domínio, das prioridades e do impacto da prova.',
        ],
        action: { label: 'Abrir cronômetro', target: 'timer' },
      },
      {
        id: 'pip-timer-guide',
        title: 'Cronômetro Flutuante (Picture-in-Picture)',
        kind: 'feature',
        summary:
          'Acompanhe seu cronômetro ou Pomodoro em uma mini janela sempre visível sobre PDFs ou videoaulas.',
        keywords: [
          'pip',
          'picture-in-picture',
          'cronômetro flutuante',
          'janela flutuante',
          'mini timer',
        ],
        paragraphs: [
          'Com a API Document Picture-in-Picture, o Extrato de Estudos permite destacar o cronômetro para uma pequena janela flutuante no canto da tela enquanto você lê PDFs, assiste a videoaulas ou resolve listas de questões em outros programas.',
          'A janela flutuante mantém os controles de pausar, retomar, avançar blocos de Pomodoro e registrar pausas sem que você precise alternar de aba no navegador.',
        ],
        bullets: [
          'Clique no ícone de tela flutuante (PiP) ao lado dos controles do cronômetro.',
          'Funciona tanto no modo cronômetro livre quanto no modo Pomodoro com intervalos programados.',
          'Ao fechar a janela flutuante, a contagem retorna perfeitamente para a interface principal.',
        ],
        action: { label: 'Abrir Cronômetro', target: 'timer' },
      },
      {
        id: 'questions',
        title: 'Questões & Simulados',
        summary: 'Desempenho e análise de erros têm registro próprio.',
        paragraphs: [
          'Informe quantidade de questões, acertos, tópico e, quando possível, a causa dos erros. Em prova certo ou errado (Cebraspe), informe também quantas deixou em branco: branco não conta como erro e não desconta na nota líquida. Com pelo menos 20 itens respondidos, o cartão Banca, ritmo e refeitas mostra o acerto quando você arrisca; abaixo de 50%, arriscar tira pontos. Os simulados mostram desempenho por disciplina e podem fundamentar uma proposta de replanejamento.',
          'Simulados agendados na Agenda ou cadastrados com data futura aparecem em Hoje com o atalho Registrar resultado; ao salvar os acertos, o compromisso na Agenda é concluído automaticamente e o Raio-X & Plano de Remediação é aberto em seguida.',
        ],
        bullets: ['Não sabia · Esqueci', 'Interpretação · Cálculo', 'Desatenção · Chute'],
        note: 'Categorizar erros ajuda a distinguir falta de conhecimento de problemas de execução.',
        action: { label: 'Registrar questões', target: 'questions' },
      },
      {
        id: 'error-notebook-guide',
        title: 'Caderno de Erros e Flashcards Ativos',
        kind: 'feature',
        summary:
          'Transforme questões erradas em aprendizado ativo com categorização cognitiva e repetição.',
        keywords: [
          'caderno de erros',
          'flashcards',
          'questões erradas',
          'pegadinha',
          'bancas',
          'revisão ativa',
        ],
        paragraphs: [
          'O Caderno de Erros permite registrar questões erradas ou marcadas com dúvida durante seus simulados e baterias de estudo.',
          'Cada erro pode ser classificado pela sua causa raiz: lacuna de conteúdo, pegadinha de banca, erro de interpretação ou falta de atenção. Isso evita que você gaste tempo relendo teorias quando o problema era apenas velocidade ou desatenção.',
          'O modo de revisão ativa em flashcards permite ocultar o gabarito e a justificativa para forçar a recuperação ativa da memória (Active Recall) antes de conferir a resposta.',
        ],
        bullets: [
          'Filtre erros por disciplina, banca examinadora ou motivo do erro.',
          'Marque erros como superados assim que acertá-los em revisões subsequentes.',
          'Exporte ou revise em blocos diários de alta densidade.',
        ],
        action: { label: 'Abrir Questões e Erros', target: 'questions' },
      },
      {
        id: 'reviews',
        title: 'Revisões espaçadas e Curva de Esquecimento',
        summary: 'Acompanhe o que está próximo, atrasado e simule o ganho da retenção.',
        visual: { type: 'simulator-ebbinghaus' },
        paragraphs: [
          'A Agenda separa revisões atrasadas, de hoje e próximas. A saúde das revisões ajuda a sinalizar manutenção do conhecimento; concluir uma revisão registra a execução real. Uma revisão crítica merece atenção, mas não deve ser tratada apenas como checklist.',
        ],
        action: { label: 'Abrir Agenda de Revisões', target: 'reviews' },
      },
      {
        id: 'recommendations',
        title: 'Recomendações inteligentes',
        summary: 'O que importa na prova + sua necessidade → Sugestão do diagnóstico.',
        flow: [
          'Prova: impacto e evidência',
          'Você: domínio, retenção e tendência',
          'Ação: estudar, revisar ou resolver questões',
        ],
        paragraphs: [
          'A prioridade considera impacto na prova, domínio, retenção, tendência, revisões, desempenho, evidência disponível e pré-requisitos. Sempre que há dados suficientes, o Extrato de Estudos mostra os fatores que levaram à sugestão. Uma recomendação pode iniciar uma sessão vinculada à decisão.',
        ],
        action: { label: 'Ver o Plano de hoje', target: 'today' },
      },
    ],
  },
  {
    id: 'guide-workflows',
    title: 'Planejar',
    summary: 'Capacidade semanal, planejamento adaptativo e fechamento.',
    entries: [
      {
        id: 'planning',
        title: 'Planejar a semana e Central do Ciclo',
        summary: 'Compare disponibilidade, proposta semanal e divisão do Ciclo em donut.',
        paragraphs: [
          'Defina as horas disponíveis, gere uma proposta semanal e confira a distribuição por disciplina, tópico e atividade. Na mesma subaba Semana fica a Central do Ciclo de Estudos, com gráfico de donut, estimativa de dias por volta e dicas da Leitura do Extrato para ajustar a duração dos blocos.',
        ],
        action: { label: 'Abrir planejamento', target: 'planning' },
      },
      {
        id: 'adaptive',
        title: 'Planejamento Adaptativo',
        summary: 'Redistribuir tempo sem criar horas adicionais.',
        flow: ['Impacto na prova', 'Necessidade do estudante', 'Possível redistribuição'],
        paragraphs: [
          'Quando uma disciplina está consolidada e outra apresenta necessidade estratégica maior, o Extrato de Estudos pode propor uma transferência limitada de minutos. A capacidade semanal é preservada. A prévia explica o motivo e exige confirmação; um intervalo de proteção evita ajustes repetidos em pouco tempo.',
        ],
        action: { label: 'Ver planejamento adaptativo', target: 'planning' },
      },
      {
        id: 'what-if-simulator-guide',
        title: 'Simulador "E se?" e Reta Final',
        kind: 'feature',
        summary:
          'Explore o impacto de horas extras ou foco em tópicos críticos sem alterar seu plano oficial.',
        keywords: ['simulador', 'what-if', 'e se', 'reta final', 'cenários', 'projeção de horas'],
        paragraphs: [
          'O simulador "E se?" permite testar hipóteses na reta final: "E se eu aumentar 5 horas semanais?", "E se eu focar 70% do tempo nas disciplinas com maior peso?", ou "E se eu mantiver meu ritmo atual até o dia da prova?".',
          'O simulador projeta a curva esperada de cobertura do edital e o tempo estimado para atingir a meta, sem alterar o seu planejamento semanal oficial. É um ambiente seguro para tomada de decisões estratégicas.',
        ],
        bullets: [
          'Simulações são isoladas e descartáveis: você só aplica mudanças ao plano se decidir confirmá-las.',
          'Leva em conta a data cadastrada da prova e as semanas restantes.',
          'Ajuda a dimensionar se metas ambiciosas cabem na sua disponibilidade real sem risco de sobrecarga.',
        ],
        action: { label: 'Abrir Planejamento', target: 'planning' },
      },
      {
        id: 'weekly',
        title: 'Fechamento semanal inteligente',
        summary: 'Ritual objetivo do que funcionou, o que ajustar e retrato imutável.',
        paragraphs: [
          'O Fechamento Semanal reúne tempo estudado, questões, acerto, o que funcionou na semana, pontos de revisão, sugestões de prioridade e um resumo narrativo. Salvar gera um retrato versionado e imutável no Histórico sem sobrescrever períodos anteriores.',
        ],
        bullets: [
          'Salve o fechamento para comparar semanas do mesmo concurso.',
          'A comparação exige períodos sem sobreposição e dados completos.',
          'O foco pode subir enquanto o tempo executado cai; leia os dois sinais juntos.',
        ],
        action: { label: 'Ver Fechamento Semanal', target: 'weekly' },
      },
    ],
  },
  {
    id: 'guide-data',
    title: 'Analisar',
    summary: 'Diagnóstico, prontidão, conquistas e resultados posteriores.',
    entries: [
      {
        id: 'adherence',
        title: 'Execução e aderência',
        summary: 'Entenda a diferença entre acumular horas e executar as prioridades do plano.',
        paragraphs: [
          'Em Desempenho → Consistência, volume compara horas realizadas e previstas e pode superar 100%. Aderência ao plano usa apenas tempo com vínculo seguro e atividade compatível, limitado à duração prevista. Execução prioritária usa a prioridade registrada quando o planejamento foi criado.',
          'O histórico de 4, 8 ou 12 semanas compara a semana em andamento com os mesmos dias da anterior. Pouca classificação histórica deixa a interpretação estratégica indisponível.',
          'Em Metas, você pode definir uma meta pessoal de aderência entre 50 e 100% ou desativá-la. Consistência e Trajetória mostram o crédito da semana até hoje; a meta não altera Prontidão, prioridade ou projeção. Ao salvar um fechamento, os valores e as explicações ficam preservados. Pendências recorrentes usam períodos salvos sem sobreposição no mesmo concurso. Revisar planejamento abre Metas; qualquer alteração exige prévia e confirmação.',
        ],
        action: { label: 'Ver execução e aderência', target: 'adherence' },
      },
      {
        id: 'diagnosis',
        title: 'Central de Diagnóstico',
        summary: 'Riscos, lacunas, oportunidades e qualidade das evidências.',
        paragraphs: [
          'Domínio resume o desempenho observado; retenção indica manutenção do conhecimento; tendência aponta a direção recente; evidência mostra o quanto a conclusão é sustentada. Impacto representa importância na prova, e lacuna combina essa importância com a necessidade pessoal. No acerto do Domínio, questões refeitas contam meio peso e, com ao menos 10 questões da banca da prova no tópico, elas contam em dobro.',
        ],
        action: { label: 'Abrir diagnóstico', target: 'diagnosis' },
      },
      {
        id: 'readiness',
        title: 'Índice de Prontidão',
        summary: 'Uma síntese de 0 a 100, sempre acompanhada de evidência.',
        paragraphs: [
          'O índice combina cobertura, domínio, retenção, consistência e simulados. Progresso real, melhora nesses fatores e evidência mais completa podem elevar o indicador; deterioração ou revisão insuficiente podem reduzi-lo. Fatores ausentes diminuem a evidência. O número não estima a chance de aprovação.',
        ],
        action: { label: 'Ver Índice de Prontidão', target: 'overview' },
      },
      {
        id: 'achievements',
        title: 'Conquistas',
        summary: 'Consistência, aprendizagem e decisões estratégicas.',
        paragraphs: [
          'As conquistas ficam em Hoje, na subaba Conquistas. Um aviso aparece quando você desbloqueia uma. Elas reconhecem progresso, mas não alteram prioridades nem o Índice de Prontidão. Estrategista exige estudo em dez tópicos distintos de alto impacto; Cobertura crítica exige domínio com evidência suficiente nos tópicos críticos de uma disciplina; Prova mapeada exige quatro provas completas no concurso ativo. As conquistas bloqueadas mostram o que falta.',
        ],
        action: { label: 'Ver conquistas', target: 'achievements' },
      },
      {
        id: 'outcomes',
        title: 'Histórico e resultados posteriores',
        summary: 'Recomendação → execução → medição → auditoria.',
        paragraphs: [
          'O histórico guarda a recomendação, a decisão e o resultado observado depois. Isso ajuda a avaliar a estratégia, mas uma melhora posterior não prova que a recomendação causou a melhora.',
        ],
        action: { label: 'Ver histórico', target: 'history' },
      },
      {
        id: 'report',
        title: 'Relatório e PDF',
        summary: 'Uma fotografia estratégica do período escolhido.',
        paragraphs: [
          'O PDF resume planejamento, desempenho, recomendações, Inteligência da Prova e foco dos últimos sete dias do período. Inclui cobertura e base histórica e até três lacunas estratégicas. Use-o para revisar ou imprimir; ele não substitui o backup JSON.',
        ],
        action: { label: 'Ir ao relatório PDF', target: 'report' },
      },
      {
        id: 'projections',
        title: 'Projeções e cenários',
        summary: 'Faixas estimadas para apoiar a leitura da preparação.',
        paragraphs: [
          'Projeções e cenários refletem os dados disponíveis e hipóteses de capacidade. São estimativas para comparar caminhos, não probabilidade de aprovação nem garantia de resultado.',
        ],
        action: { label: 'Ver projeções', target: 'overview' },
      },
    ],
  },
  {
    id: 'guide-exam',
    title: 'Inteligência da prova',
    summary: 'Histórico, incidência, qualidade e Matriz Prova × Você.',
    entries: [
      {
        id: 'exam-history',
        title: 'Provas históricas',
        summary: 'Entenda o que costuma aparecer na prova.',
        flow: [
          'Provas históricas',
          'Questões classificadas',
          'Tópicos e incidência',
          'Base histórica',
          'Impacto na prova',
        ],
        paragraphs: [
          'Para saber o que a banca cobra, use Contar uma prova: escolha uma prova anterior, informe instituição, cargo, banca e ano, e diga quantas questões caíram em cada tópico. Sem o total da prova, a contagem vale como a prova inteira; com um total maior que o contado, a prova fica parcial e não entra na incidência. Contar de novo a mesma prova substitui a contagem anterior.',
          'Quem tem a prova em JSON pode importá-la com prévia e confirmação das associações; reimportar a mesma prova não duplica questões. Nos dois caminhos, essas questões formam evidência de incidência e ficam separadas das questões que você resolveu para medir seu desempenho.',
        ],
        action: { label: 'Abrir Inteligência da Prova', target: 'exam' },
      },
      {
        id: 'exam-quality',
        title: 'Qualidade do histórico',
        summary: 'A força da amostra vem antes do impacto.',
        paragraphs: [
          'O Extrato de Estudos observa provas completas e parciais, cobertura conhecida, questões classificadas, pendências e base histórica. Provas parciais não são tratadas como ausência do tópico. Uma base pequena não significa desempenho ruim: quando o histórico é insuficiente, sua influência no impacto é limitada.',
        ],
        action: { label: 'Revisar qualidade da base', target: 'exam' },
      },
      {
        id: 'exam-audit',
        title: 'Configurado × Histórico',
        summary: 'Compare sua estratégia com a evidência sem sobrescrever escolhas.',
        paragraphs: [
          'A auditoria confronta o impacto configurado com o observado nas provas e destaca alinhamentos e divergências. Valores manuais ou oficiais continuam prevalecendo até você decidir alterá-los; inferência histórica nunca é apresentada como peso oficial.',
        ],
        bullets: [
          'Exemplo: configurado 80/100; histórico observado 84/100.',
          'O estado pode ser alinhado, enquanto o valor usado segue a fonte configurada.',
        ],
        action: { label: 'Ver auditoria', target: 'audit' },
      },
      {
        id: 'exam-matrix',
        title: 'Matriz Prova × Você',
        summary: 'Importância da prova e situação pessoal lado a lado.',
        flow: [
          'Prova: incidência e impacto',
          'Você: domínio, retenção e tendência',
          'Prioridade: importância × necessidade',
        ],
        paragraphs: [
          'Um tópico frequente que você domina pode pedir manutenção. Outro, também importante e com domínio baixo, pode merecer estudo agora. A matriz permite filtrar provas e abrir o detalhe de um tópico para entender essa combinação.',
        ],
        bullets: ['Exemplo: impacto alto e domínio 42/100 indicam uma lacuna relevante.'],
        action: { label: 'Abrir Matriz Prova × Você', target: 'matrix' },
      },
    ],
  },
  {
    id: 'guide-safety',
    title: 'Dados e segurança',
    summary: 'Backup, uso offline, atalhos e demonstração.',
    entries: [
      {
        id: 'backup',
        title: 'Seus dados e backup',
        summary: 'Os dados ficam neste navegador.',
        paragraphs: [
          'O Extrato de Estudos opera de forma Local-First: seus dados ficam salvos neste navegador (IndexedDB/localStorage), sem conta obrigatória. Você pode exportar backups JSON regularmente ou configurar sincronização opcional via WebDAV com criptografia de ponta a ponta (AES-GCM 256 bits).',
          'A restauração valida o arquivo antes de substituir a base; o PDF é apenas relatório e não é restaurável. Depois do primeiro carregamento completo por HTTP, o PWA instalado pode abrir offline.',
        ],
        action: { label: 'Ir ao backup', target: 'backup' },
      },
      {
        id: 'guide-shortcuts',
        title: 'Acesso rápido e atalhos',
        summary: 'Encontre áreas, comandos e tópicos pelo teclado.',
        paragraphs: [
          'Ctrl + K (ou Cmd + K no Mac) abre a busca global com acesso direto a Estudo Rápido, Leitura do Extrato, Diário de Aprendizagem, Central do Ciclo, Ver conquistas, páginas e tópicos. Ctrl/Cmd + Shift + 1–8 alterna entre as oito áreas, na ordem das abas. Em Desempenho, Alt + 1–5 troca de subaba e Alt + 6–9 muda o período. Esc fecha busca, menu ou modal.',
        ],
      },
      {
        id: 'demo',
        title: 'Modo demonstração',
        summary: 'Explore o produto com dados fictícios separados.',
        paragraphs: [
          'A demonstração permite conhecer prioridades, planejamento, relatórios e histórico sem cadastrar uma base real. Reiniciar ou encerrar a demo não altera seus dados reais.',
        ],
        action: { label: 'Explorar demonstração', target: 'demo' },
      },
    ],
  },
];

// Didactic examples only: no live state or domain calculations.
const start = BASE_HELP_CATEGORIES.find(category => category.id === 'guide-start');
start.entries.unshift({
  id: 'how-it-works',
  kind: 'feature',
  wide: true,
  title: 'Como o Extrato de Estudos funciona',
  summary: 'Da configuração às decisões, cada registro dá contexto ao próximo passo.',
  visual: {
    type: 'flow',
    title: 'Mapa do Extrato de Estudos',
    steps: [
      { title: 'Configurar', detail: 'Objetivo, prova e edital' },
      { title: 'Planejar', detail: 'Prioridades e disponibilidade' },
      { title: 'Estudar', detail: 'Aba Hoje e sessões' },
      { title: 'Registrar', detail: 'Questões, revisões e simulados' },
      { title: 'Analisar', detail: 'Desempenho, diagnóstico e prontidão' },
      { title: 'Ajustar', detail: 'Prévia, capacidade e confirmação' },
    ],
  },
  keywords: ['mapa', 'como funciona', 'fluxo', 'configuração'],
  paragraphs: ['O sistema analisa e propõe. Você decide e confirma alterações no planejamento.'],
  action: { label: 'Conhecer a aba Hoje', target: 'today' },
});
const first = start.entries.find((entry: any) => entry.id === 'first-steps');
first.steps = [
  { title: 'Configure sua prova', detail: 'Escolha o objetivo e informe a data.' },
  { title: 'Defina sua disponibilidade', detail: 'Reserve horas que realmente cabem na semana.' },
  { title: 'Monte o edital', detail: 'Cadastre ou importe disciplinas e tópicos.' },
  { title: 'Confira o planejamento', detail: 'Revise a prévia e confirme o primeiro plano.' },
  { title: 'Comece pela aba Hoje', detail: 'Inicie uma atividade vinculada ao plano.' },
  {
    title: 'Registre seus resultados',
    detail: 'Informe questões, simulados e revisões para dar contexto às análises.',
  },
];
first.keywords = ['primeiro acesso', 'onboarding', 'começar', 'configurar'];
const study = BASE_HELP_CATEGORIES.find(category => category.id === 'guide-areas');
const today = study.entries.find((entry: any) => entry.id === 'today-guide');
today.visual = {
  type: 'daily',
  title: 'Execução do dia',
  planned: 35,
  actual: 20,
  progress: 57,
  completed: 0,
  total: 1,
};
today.paragraphs = [
  'A aba Hoje reúne o plano diário e as pendências. O card de execução na Visão Geral também permite iniciar a próxima atividade com vínculo ao plano.',
];
today.bullets = [
  'Progresso temporal não é contagem de atividades concluídas.',
  'Teoria não conclui uma tarefa de questões; estudo sem vínculo aparece como adicional.',
  'Registrar, editar ou excluir uma sessão atualiza o progresso.',
];
today.keywords = ['execução diária', 'pendências', 'plano do dia'];
const sessions = study.entries.find((entry: any) => entry.id === 'sessions');
sessions.visual = { type: 'comparison', title: 'Planejado e realizado', planned: 35, actual: 32 };
sessions.paragraphs = [
  'O planejado representa a intenção. O realizado vem das sessões registradas, com cronômetro ou lançamento manual. Informe disciplina, tópico e tipo de estudo.',
];
sessions.note = 'Prefira informar o tópico para dar contexto ao domínio e às prioridades.';
sessions.keywords = ['tempo de estudo', 'cronômetro', 'sessão manual'];
const reviews = study.entries.find((entry: any) => entry.id === 'reviews');
reviews.visual = {
  type: 'reviews',
  title: 'Manutenção do conhecimento',
  steps: [
    { title: 'Estudo', detail: 'Registre o contato com o tópico.' },
    { title: 'Revisão', detail: 'Consulte o que está atrasado, hoje ou próximo na Agenda.' },
    { title: 'Nova revisão espaçada', detail: 'Siga a agenda e registre a execução real.' },
  ],
};
reviews.paragraphs = [
  'A Agenda organiza revisões para acompanhar a manutenção do conhecimento. Uma revisão atrasada merece atenção; sua conclusão deve refletir o que você realizou.',
];
reviews.keywords = ['revisão atrasada', 'agenda', 'retenção'];
const recommendation = study.entries.find((entry: any) => entry.id === 'recommendations');
recommendation.visual = {
  type: 'action',
  title: 'Próxima atividade',
  subject: 'Português',
  topic: 'Interpretação de texto',
  activity: 'Teoria',
  minutes: 35,
};
recommendation.paragraphs = [
  'A próxima atividade do plano informa disciplina, tópico, tipo e duração. A recomendação estratégica considera os fatores disponíveis e pode estar fora do plano atual.',
];
recommendation.bullets = [
  'Consulte a justificativa e a força das evidências.',
  'Antes de mudar a carga, confira a prévia e confirme a alteração.',
];
recommendation.keywords = ['sugestão do diagnóstico', 'próxima ação', 'recomendação', 'justificativa'];
recommendation.flow = null;

const planningGuide = BASE_HELP_CATEGORIES.find(category => category.id === 'guide-workflows');
Object.assign(
  planningGuide.entries.find((entry: any) => entry.id === 'planning'),
  {
    visual: {
      type: 'allocation',
      title: 'Distribuir a disponibilidade semanal',
      rows: [
        { label: 'Português', before: 240, after: 240 },
        { label: 'Matemática', before: 300, after: 300 },
        { label: 'Informática', before: 180, after: 180 },
      ],
      total: 720,
    },
    paragraphs: [
      'Defina sua disponibilidade e confira como as atividades cabem na semana. No exemplo, 720 minutos disponíveis são distribuídos entre três disciplinas. Planejado é intenção; realizado vem dos registros de estudo.',
    ],
  }
);
planningGuide.entries.push({
  id: 'recovery-guide',
  title: 'Plano de Recuperação',
  kind: 'feature',
  wide: true,
  summary: 'Entenda a proposta antes de decidir.',
  keywords: ['recovery', 'recuperação', 'redistribuição', 'capacidade'],
  visual: {
    type: 'allocation',
    title: 'Recuperação com a mesma carga semanal',
    rows: [
      { label: 'Português', before: 240, after: 210 },
      { label: 'Matemática', before: 300, after: 330 },
      { label: 'Informática', before: 180, after: 180 },
    ],
    total: 720,
  },
  paragraphs: [
    'Neste exemplo, 30 minutos saem de Português, mais consolidado, para Matemática, uma lacuna de alto impacto. A carga permanece em 720 minutos; o exemplo não representa uma recomendação para seus dados.',
    'A proposta reutiliza as proteções do planejamento adaptativo: manutenção, restrições, conteúdo ativo e intervalo entre alterações. Pode haver recuperação limitada ou nenhuma redistribuição segura.',
  ],
  note: 'Abrir a prévia não altera seu plano. A aplicação exige confirmação e nova validação do estado; sessões concluídas e histórico são preservados.',
  action: { label: 'Consultar planejamento', target: 'planning' },
});
planningGuide.entries.push({
  id: 'sustainability-guide',
  title: 'Sustentabilidade do plano',
  kind: 'concept',
  summary: 'Compare intenção e execução ao longo de semanas comparáveis.',
  keywords: ['sustentabilidade', 'carga', 'planejado', 'realizado'],
  visual: {
    type: 'weekly-bars',
    title: 'Carga planejada e tempo realizado',
    weeks: [
      { label: 'Semana 1', planned: 720, actual: 480 },
      { label: 'Semana 2', planned: 720, actual: 540 },
      { label: 'Semana 3', planned: 720, actual: 480 },
    ],
  },
  paragraphs: [
    'Uma diferença recorrente pode indicar que a carga merece revisão. A análise usa semanas comparáveis e explicita quando faltam evidências; estes valores são apenas didáticos.',
    'Revisar a disponibilidade é uma decisão separada de redistribuir o plano. Nenhuma mudança de capacidade é aplicada automaticamente.',
  ],
  action: { label: 'Revisar disponibilidade', target: 'planning' },
});
const analysisGuide = BASE_HELP_CATEGORIES.find(category => category.id === 'guide-data');
Object.assign(
  analysisGuide.entries.find((entry: any) => entry.id === 'readiness'),
  {
    kind: 'concept',
    visual: { type: 'readiness', title: 'Síntese da preparação', value: 72 },
    paragraphs: [
      'O Índice de Prontidão reúne sinais de cobertura, domínio, retenção, consistência e simulados. Leia o índice junto ao diagnóstico e à qualidade das evidências.',
    ],
    note: '72/100 não significa 72% de chance de aprovação.',
  }
);
Object.assign(
  analysisGuide.entries.find((entry: any) => entry.id === 'adherence'),
  {
    visual: {
      type: 'adherence',
      title: 'Volume e prioridades são medidas diferentes',
      rows: [
        { label: 'Português · prioritária', planned: 30, actual: 30 },
        { label: 'Matemática · prioritária', planned: 30, actual: 30 },
        { label: 'Informática · manutenção', planned: 30, actual: 0 },
      ],
      load: 67,
      priorities: 100,
    },
    paragraphs: [
      'Neste exemplo, duas atividades prioritárias foram concluídas e uma atividade de manutenção ficou pendente: 60 dos 90 minutos previstos foram executados. Todas têm classificação registrada no plano.',
      'Aderência de carga usa tempo vinculado e compatível, limitado ao previsto em cada atividade. Execução das prioridades usa a classificação preservada no planejamento. Volume adicional não substitui automaticamente uma atividade pendente.',
      'Compare semanas equivalentes e observe a cobertura da classificação. Quando faltam registros, o sistema explicita a limitação; metas de aderência não mudam o algoritmo de prioridade.',
    ],
  }
);
analysisGuide.entries.push({
  id: 'evidence-guide',
  title: 'Evidência, base histórica e confiança',
  kind: 'concept',
  summary: 'Dados suficientes precisam também ser comparáveis e estatisticamente significativos.',
  keywords: [
    'evidência',
    'confiança',
    'amostra insuficiente',
    'poucos dados',
    'amostragem',
    'margem de erro',
  ],
  visual: {
    type: 'simulator-evidence',
    title: 'Simulador de Força da Evidência e Amostragem',
  },
  paragraphs: [
    'A evidência nas análises do Extrato de Estudos obedece ao princípio estatístico da amostragem (Lei dos Grandes Números): volumes muito pequenos de questões geram margens de erro excessivamente amplas, tornando qualquer conclusão precoce sobre maestria ou deficiência altamente volátil.',
    'Três palavras, três usos: Evidência (Alta, Média ou Baixa) é a força de um número do seu estudo; Base histórica é a evidência das provas da banca; Confiança é só da faixa projetada de nota. Domínio e retenção são sempre de 0 a 100. A meta de domínio, em Planejamento, é um alvo escrito em %: 80% equivale a 80/100 do índice.',
    'O algoritmo adota uma postura prudente: com menos de 10 questões, ele evita rotular tópicos como dominados ou condenados e prioriza a coleta de evidências. A partir de 30 questões, a tendência se estabiliza, e acima de 80 questões atinge robustez estatística com margem de erro reduzida.',
  ],
});
analysisGuide.entries.push({
  id: 'insufficient-sample-guide',
  title: 'Amostra insuficiente',
  kind: 'concept',
  summary: 'Não significa desempenho ruim.',
  keywords: ['amostra insuficiente', 'tendência', 'respostas', 'questões'],
  visual: {
    type: 'comparison',
    title: 'Exemplo de volume diferente entre períodos',
    planned: 30,
    actual: 8,
  },
  paragraphs: [
    'Para comparar uma tendência, os períodos precisam ter evidência suficiente. Aqui, 30 e 8 representam quantidades de questões, não uma meta universal: cada análise tem suas próprias regras. Registre respostas no tópico e consulte os requisitos apresentados pela análise.',
  ],
});
analysisGuide.entries.find((e: any) => e.id === 'insufficient-sample-guide').visual = {
  type: 'sample',
  title: 'Questões em períodos de comparação',
  previous: 30,
  recent: 8,
};
const weeklyGuide = planningGuide.entries.find((e: any) => e.id === 'weekly');
weeklyGuide.visual = {
  type: 'flow',
  title: 'Da semana à próxima decisão',
  steps: [
    { title: 'Planejado', detail: 'Intenção registrada' },
    { title: 'Realizado', detail: 'Sessões e resultados' },
    { title: 'Prioridades', detail: 'O que foi atendido' },
    { title: 'Padrões', detail: 'Semanas comparáveis' },
    { title: 'Decisão', detail: 'Manter ou revisar com confirmação' },
  ],
};
planningGuide.entries = planningGuide.entries.filter((e: any) => e.id !== 'weekly');
analysisGuide.entries.push(weeklyGuide);
const examGuide = BASE_HELP_CATEGORIES.find(c => c.id === 'guide-exam');
Object.assign(
  examGuide.entries.find((e: any) => e.id === 'exam-matrix'),
  {
    wide: true,
    visual: {
      type: 'matrix',
      title: 'Incidência e domínio orientam a interpretação',
      cells: [
        {
          title: 'Alta incidência · baixo domínio',
          detail: 'Maior atenção, conforme evidência e outros sinais.',
        },
        { title: 'Alta incidência · alto domínio', detail: 'Manutenção do conhecimento.' },
        {
          title: 'Baixa incidência · baixo domínio',
          detail: 'Necessidade pessoal com prioridade estratégica relativa menor.',
        },
        {
          title: 'Baixa incidência · alto domínio',
          detail: 'Acompanhar sem deslocar lacunas mais relevantes.',
        },
      ],
    },
    note: 'Incidência é presença nas provas analisadas. Impacto considera também pesos, fontes e base histórica; a matriz didática não substitui o mecanismo de prioridade.',
  }
);
examGuide.entries.push({
  id: 'recommendation-origin-guide',
  title: 'De onde vem a recomendação?',
  summary: 'Evidências diferentes se encontram na Sugestão do diagnóstico.',
  keywords: ['origem', 'recomendação', 'prioridade', 'questões', 'simulados'],
  visual: {
    type: 'flow',
    title: 'Da evidência à ação',
    steps: [
      {
        title: 'Evidências',
        detail: 'Questões, simulados, progresso, revisões e histórico da prova',
      },
      { title: 'Prioridade', detail: 'Importância na prova × necessidade pessoal' },
      { title: 'Sugestão do diagnóstico', detail: 'Proposta explicada com os dados disponíveis' },
    ],
  },
  paragraphs: [
    'Quando um fator não tem evidência suficiente, o sistema explicita a limitação. Uma recomendação não cria horas, não garante uma nota futura e não aplica alterações estratégicas sem sua confirmação.',
  ],
  action: { label: 'Consultar recomendações', target: 'diagnosis' },
});
const dataGuide = BASE_HELP_CATEGORIES.find(c => c.id === 'guide-safety');
function getSubjectGuide() {
  return BASE_HELP_CATEGORIES.find(c => c.id === 'guide-areas').entries.find(
    (e: any) => e.id === 'subjects'
  );
}
Object.assign(getSubjectGuide(), {
  visual: {
    type: 'tree',
    title: 'Organize o conteúdo',
    subject: 'Português',
    topics: ['Interpretação', 'Gramática', 'Redação'],
  },
  keywords: ['edital', 'disciplina', 'tópico', 'catálogo'],
});
dataGuide.entries.push({
  id: 'imports-guide',
  title: 'Importar com revisão',
  summary: 'Confira o formato e a prévia do fluxo escolhido.',
  keywords: ['importação', 'importar', 'JSON', 'edital', 'provas históricas', 'contar prova', 'incidência'],
  visual: {
    type: 'flow',
    title: 'Importação de provas históricas',
    steps: [
      { title: 'Arquivo JSON', detail: 'Prova e questões estruturadas' },
      { title: 'Prévia', detail: 'Mapear disciplinas, tópicos e conflitos' },
      { title: 'Confirmar', detail: 'Mesclar os registros revisados' },
    ],
  },
  paragraphs: [
    'O assistente de edital cadastra conteúdo. Contar uma prova ou importar uma em JSON alimenta incidência, sem criar resultados pessoais de questões respondidas. Backup é um terceiro fluxo: restaura a base e deve ser usado com atenção.',
    'Confira as associações antes de confirmar. Tópicos desconhecidos exigem decisão e reimportar a mesma prova não deve duplicar suas questões.',
  ],
  action: { label: 'Consultar provas históricas', target: 'exam' },
});
Object.assign(
  dataGuide.entries.find((e: any) => e.id === 'backup'),
  {
    visual: {
      type: 'flow',
      title: 'Leve sua base para outro navegador',
      steps: [
        { title: 'Exportar', detail: 'Salvar backup JSON' },
        { title: 'Guardar', detail: 'Manter uma cópia segura do arquivo' },
        { title: 'Restaurar', detail: 'Selecionar e validar antes de confirmar' },
      ],
    },
    note: 'PDF é relatório, não backup. Faça uma cópia antes de limpar dados ou substituir a base.',
  }
);
Object.assign(
  dataGuide.entries.find((e: any) => e.id === 'demo'),
  {
    visual: {
      type: 'reference',
      title: 'Explore uma preparação fictícia',
      items: [
        { title: '3+ meses', detail: 'Histórico de estudos' },
        { title: 'Questões e simulados', detail: 'Resultados ilustrativos' },
        { title: 'Planejamento e análises', detail: 'Explore o ciclo de decisões' },
      ],
    },
    keywords: ['demo', 'demonstração', 'dados fictícios'],
    note: 'A demonstração usa uma base separada. Seus resultados fictícios não descrevem sua preparação real.',
  }
);
// Stable IDs preserve navigation and search across the editorial update.
const subjectEntry = BASE_HELP_CATEGORIES.find(
  category => category.id === 'guide-areas'
).entries.find((entry: any) => entry.id === 'subjects');
export const HELP_CATEGORIES = BASE_HELP_CATEGORIES.flatMap(category => {
  const entries =
    category.id === 'guide-areas'
      ? category.entries.filter((entry: any) => entry.id !== 'subjects')
      : category.id === 'guide-safety'
        ? [subjectEntry, ...category.entries]
        : category.entries;
  const result = {
    ...category,
    title:
      category.id === 'guide-exam'
        ? 'Prova'
        : category.id === 'guide-safety'
          ? 'Dados'
          : category.title,
    entries,
  };
  return category.id === 'guide-safety'
    ? [
        {
          id: 'guide-goals',
          title: 'Metas',
          summary: 'Volume, rotina e resultados para orientar sua preparação.',
          entries: [
            {
              id: 'goals-guide',
              title: 'Metas de estudo',
              summary: 'Defina objetivos que caibam na sua rotina.',
              paragraphs: [
                'Configure suas metas em Metas. Compare o realizado com o planejado e revise a disponibilidade antes de aceitar alterações na distribuição.',
              ],
              action: { label: 'Abrir Metas', target: 'planning' },
            },
          ],
        },
        result,
      ]
    : [result];
}).map(category => ({
  ...category,
  entries: category.entries.map((entry: any) => ({
    kind: 'feature',
    keywords: [],
    concepts: [],
    questions: [],
    ...entry,
  })),
}));

const goalsGuide = HELP_CATEGORIES.find(c => c.id === 'guide-goals').entries[0];
Object.assign(goalsGuide, {
  keywords: ['meta', 'volume', 'rotina', 'resultado', 'questões', 'horas'],
  visual: {
    type: 'reference',
    title: 'Objetivos com papéis diferentes',
    items: [
      { title: 'Volume', detail: 'Horas, questões e simulados' },
      { title: 'Rotina', detail: 'Consistência e aderência' },
      { title: 'Resultado', detail: 'Objetivo da preparação' },
    ],
  },
  paragraphs: [
    'Defina objetivos compatíveis com sua disponibilidade. Metas de volume e rotina acompanham execução; não equivalem a probabilidade de aprovação.',
    'No exemplo, 124 questões de uma meta de 150 representam aproximadamente 83% do volume desejado, sem informar domínio ou precisão. Metas de precisão por disciplina devem ser lidas junto ao resultado observado.',
  ],
});
const planningCategory = HELP_CATEGORIES.find(c => c.id === 'guide-workflows');
const studyCategory = HELP_CATEGORIES.find(c => c.id === 'guide-areas');
const calendarEntry = studyCategory.entries.find((e: any) => e.id === 'calendar-guide');
studyCategory.entries = studyCategory.entries.filter((e: any) => e.id !== 'calendar-guide');
planningCategory.entries.push(calendarEntry);
Object.assign(calendarEntry, {
  keywords: ['calendário', 'agenda', 'datas', 'carga por dia'],
  paragraphs: [
    'Consulte a distribuição por data e os filtros de disciplinas. Compare atividades planejadas, sessões e revisões antes de decidir redistribuir a semana. Navegar pelo calendário não confirma mudanças no plano.',
  ],
});
studyCategory.entries.push({
  kind: 'feature',
  concepts: [],
  questions: [],
  id: 'pending-guide',
  title: 'Pendências do dia',
  summary: 'Um dia incompleto não apaga o que você estudou.',
  keywords: ['pendência', 'pendências', 'atraso', 'não concluído'],
  paragraphs: [
    'O rodapé da execução mostra as atividades do plano ainda por fazer hoje. O progresso temporal e a contagem de atividades concluídas são medidas diferentes.',
    'Registre o que foi realizado e confira as pendências em Hoje. Sessões sem vínculo contam como estudo adicional; uma atividade incompatível não conclui automaticamente a tarefa planejada. Replanejar exige revisar a proposta e confirmar.',
  ],
  action: { label: 'Revisar em Hoje', target: 'today' },
});
studyCategory.entries.find((e: any) => e.id === 'sessions').paragraphs = [
  'Escolha disciplina, tópico e tipo antes de iniciar. Retome o cronômetro de uma sessão ativa ou finalize essa sessão antes de começar outra atividade. Ao finalizar, confira a duração e salve o registro.',
  'Também é possível registrar uma sessão manual. O realizado vem dos registros salvos; quando houver vínculo compatível com o plano, ele alimenta o progresso da atividade, limitado ao previsto.',
];
const searchHints: Record<string, Record<string, string[]>> = {
  readiness: {
    concepts: ['índice de prontidão', 'aprovação'],
    questions: ['Por que minha Prontidão não mudou?'],
  },
  adherence: {
    concepts: ['planejado versus realizado', 'execução do plano'],
    questions: ['Por que planejado é diferente do realizado?'],
  },
  'recovery-guide': {
    concepts: ['reorganizar planejamento', 'recuperar plano'],
    questions: ['Recovery apaga meu planejamento anterior?'],
  },
  backup: {
    keywords: ['restaurar', 'restauração', 'exportar', 'trocar navegador'],
    questions: ['Como salvar meus dados?'],
  },
  reviews: { keywords: ['revisão', 'revisões', 'atrasada', 'reabrir'] },
  demo: { keywords: ['demo', 'demonstração', 'experimentar', 'dados fictícios'] },
  'insufficient-sample-guide': { questions: ['Por que aparece amostra insuficiente?'] },
};
for (const entry of HELP_CATEGORIES.flatMap(category => category.entries)) {
  const hints = searchHints[entry.id];
  if (hints)
    for (const [field, values] of Object.entries(hints))
      entry[field] = [...((entry[field] || []) as any[]), ...((values || []) as any[])];
}
export const HELP_GLOSSARY = [
  [
    'Índice de Prontidão',
    'Síntese de cobertura, domínio, retenção, consistência e simulados. Não é probabilidade de aprovação.',
  ],
  [
    'Domínio',
    'Estimativa do desempenho consolidado em um tópico, acompanhada da força da evidência.',
  ],
  [
    'Retenção',
    'Sinal de manutenção do conhecimento baseado no histórico disponível de estudo e revisão.',
  ],
  [
    'Impacto',
    'Importância estratégica do tópico para a prova; pode vir de configuração ou de histórico validado.',
  ],
  [
    'Incidência',
    'Presença de um tópico nas provas analisadas, distinta da participação em questões.',
  ],
  [
    'Evidência',
    'Força de uma medida considerando volume, qualidade e comparabilidade dos dados. Evidência limitada preserva a incerteza.',
  ],
  [
    'Evidência',
    'Sessões, questões, revisões e provas históricas usadas conforme a métrica calculada.',
  ],
  ['Lacuna', 'Encontro entre relevância para a prova e necessidade pessoal de aprendizagem.'],
  [
    'Foco estratégico',
    'Parcela do tempo registrado em tópicos de alto impacto; indicador sem meta mínima.',
  ],
  [
    'Planejamento adaptativo',
    'Proposta confirmável de redistribuir minutos dentro da capacidade semanal.',
  ],
  [
    'Aderência',
    'Relação entre plano e execução vinculada. A carga e a execução das prioridades são medidas distintas.',
  ],
  [
    'Prioridade',
    'Importância relativa para orientar o estudo, combinando relevância na prova e necessidade pessoal.',
  ],
  [
    'Retrato',
    'Registro congelado de uma semana no fechamento semanal. Fica no Histórico e não é recalculado depois.',
  ],
  [
    'Recovery',
    'Proposta de reorganização segura do planejamento, com capacidade preservada e aplicação confirmada.',
  ],
  [
    'Ciclo de Estudos',
    'Fila rotativa contínua de blocos por disciplina que pausa nos dias sem estudo sem gerar falsos atrasos.',
  ],
  [
    'Leitura do Extrato',
    'Painel determinístico que explica prioridades, ciclo e semana usando apenas seus dados locais.',
  ],
];

export const HELP_FAQ = [
  [
    'Por que meu índice ainda tem evidência baixa?',
    'Ainda há pouca evidência em um ou mais fatores. Evidência baixa não significa automaticamente baixo desempenho.',
  ],
  [
    'Prontidão é probabilidade de aprovação?',
    'Não. É um índice composto de acompanhamento, que deve ser lido junto às análises detalhadas.',
  ],
  [
    'O que acontece se eu perder um dia do plano?',
    'Registre o que foi feito, trate pendências em Hoje e confirme uma nova proposta se a carga deixar de ser viável.',
  ],
  [
    'Como levo meus dados para outro dispositivo?',
    'Exporte um backup JSON, transfira o arquivo com segurança e importe-o no outro navegador. O PDF não restaura dados.',
  ],
  [
    'Por que o app conta simulados de formas diferentes?',
    'São três contas, cada uma com o seu critério e a sua janela. A aba Simulados mostra a média simples dos simulados do período escolhido. A faixa projetada usa a mediana dos 3 últimos simulados comparáveis (mesma meta, prova e composição). O fator Simulados da Prontidão usa a média ponderada dos 5 últimos simulados de todo o histórico, sem filtro de composição.',
  ],
  [
    'Qual a diferença entre Ciclo de Estudos e Agenda do dia?',
    'O Ciclo de Estudos (padrão) segue uma fila rotativa contínua entre disciplinas e retoma de onde você parou sem acumular atrasos; a Agenda do dia fixa tarefas em datas específicas do calendário.',
  ],
  [
    'O aplicativo funciona sem internet?',
    'Depois do primeiro carregamento completo por HTTP e da instalação, o PWA pode abrir offline; os registros continuam locais.',
  ],
];

Object.assign(
  HELP_CATEGORIES.find(category => category.id === 'guide-data').entries.find(
    (entry: any) => entry.id === 'projections'
  ),
  {
    title: 'Trajetória, faixa e confiança',
    action: { label: 'Ver projeção em Simulados', target: 'projection' },
    keywords: ['projeção', 'meta', 'confiança', 'simulados comparáveis', 'reta final'],
    paragraphs: [
      'A faixa atual usa simulados comparáveis recentes. A tendência descreve a continuação aproximada do padrão observado, sem prever a nota do dia da prova ou a chance de aprovação. Poucas observações, baixa cobertura ou composição desconhecida limitam a confiança.',
      'Comparações semanais exigem a mesma meta, prova, escopo e versão do cálculo. Alterar a meta não significa que seu desempenho piorou. Snapshots anteriores preservam a leitura registrada na época.',
      'A fase da prova pode sugerir outra distribuição entre teoria, questões e revisões. A prévia mantém a capacidade e exige confirmação; não acrescenta horas nem garante ganho de nota. Simulações são temporárias e não alteram o planejamento real.',
    ],
  }
);
