export function buildProjectionConfidence(calibrated, forecast) {
  if (!calibrated?.available) return {level: 'insufficient', reasons: [calibrated?.reason || 'Simulados comparáveis insuficientes.']};
  const reasons = [];
  if (calibrated.confidence === 'low') reasons.push('A calibração dos simulados ainda é limitada.');
  if (!forecast?.forecast30?.available) reasons.push('Não há períodos suficientes para estimar a tendência de 30 dias.');
  const evidence=calibrated.evidence||{};
  if(evidence.compositionKnown===false)reasons.push('A distribuição das questões por disciplina não está completamente identificada.');
  if(calibrated.calibration?.state==='insufficient')reasons.push('Ainda faltam observações para conferir os erros retrospectivos da faixa.');
  // The current calibrated model reaches moderate at most; do not upgrade it using study volume.
  return {level: calibrated.confidence === 'moderate' && forecast?.forecast30?.available ? 'moderate' : 'low', reasons};
}
