export function buildProjectionConfidence(calibrated, forecast) {
  if (!calibrated?.available) return {level: 'insufficient', reasons: [calibrated?.reason || 'Simulados comparáveis insuficientes.']};
  const reasons = [];
  if (calibrated.confidence === 'low') reasons.push('A calibração dos simulados ainda é limitada.');
  if (!forecast?.forecast30?.available) reasons.push('Não há períodos suficientes para estimar a tendência de 30 dias.');
  // The current calibrated model reaches moderate at most; do not upgrade it using study volume.
  return {level: calibrated.confidence === 'moderate' && forecast?.forecast30?.available ? 'moderate' : 'low', reasons};
}
