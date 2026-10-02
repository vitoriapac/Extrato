import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecisionCoherenceReport} from '../../src/application/diagnostics/build-decision-coherence-report.js';
import {decisionCoherenceScenarios} from '../fixtures/decision-coherence/scenarios.js';

for(const [name,scenario] of Object.entries(decisionCoherenceScenarios)){
  test(`coerência entre motores: ${name}`,()=>{
    const {expected,...outputs}=structuredClone(scenario);
    const before=structuredClone(outputs);
    const report=buildDecisionCoherenceReport(outputs);
    assert.equal(report.status,expected);
    assert.equal(report.summary.risks,outputs.trajectory.status==='insufficient_data'?0:outputs.trajectory.topicRisks.length);
    assert.equal(report.summary.explained+report.summary.unexplained,report.divergences.length);
    assert.deepEqual(outputs,before);
  });
}
