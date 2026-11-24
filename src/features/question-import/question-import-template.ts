export const QUESTION_IMPORT_TEMPLATE_FILE_NAME = 'modelo-questoes-studytrack.csv';

/**
 * Modelo CSV de exemplo para a importação de questões, datado com o dia informado.
 * @param today data local AAAA-MM-DD
 */
export function buildQuestionImportTemplate(today: string) {
  const [year, month, day] = String(today).split('-');
  const date = `${day}/${month}/${year}`;
  return (
    'Data,Disciplina,Tópico,Banca,Resolvidas,Acertos,Erros,Tempo,Refeita\n' +
    `${date},Português,Interpretação de Texto,Cesgranrio,15,13,2,30,não\n` +
    `${date},Matemática,Porcentagem,FGV,10,8,2,25,sim\n`
  );
}
