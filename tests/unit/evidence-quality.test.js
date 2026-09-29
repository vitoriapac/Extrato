import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEvidenceQuality} from '../../src/application/analytics/build-evidence-quality.js';
import {renderEvidenceQuality} from '../../src/ui/renderers/evidence-quality-renderer.js';
test('qualidade normaliza rótulos sem criar volumes ou confiança ausentes',()=>{
 assert.equal(buildEvidenceQuality({label:'Média'}).level,'Moderada');
 assert.equal(buildEvidenceQuality({confidence:.8}).level,'Alta');
 const unknown=buildEvidenceQuality({counts:{questoes:null,provas:0}});
 assert.equal(unknown.assessed,false);assert.equal(unknown.counts.length,1);assert.equal(unknown.counts[0].value,0);
 assert.match(renderEvidenceQuality({reasons:['<script>']}),/&lt;script&gt;/);assert.match(renderEvidenceQuality(),/<summary>/);
});
