export const QUESTION_IMPORT_TEMPLATE_FILE_NAME = 'modelo-questoes-studytrack.csv';

/**
 * Modelo CSV de exemplo para a importação de questões, datado com o dia informado.
 * @param {string} today data local AAAA-MM-DD
 */
export function buildQuestionImportTemplate(today) {
  const [year, month, day] = String(today).split('-');
  const date = `${day}/${month}/${year}`;
  return (
    'Data,Disciplina,Tópico,Resolvidas,Acertos,Erros\n' +
    `${date},Português,Interpretação de Texto,15,13,2\n` +
    `${date},Matemática,Porcentagem,10,8,2\n`
  );
}
