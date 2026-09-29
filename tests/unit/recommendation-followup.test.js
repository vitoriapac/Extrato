import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRecommendationFollowup} from '../../src/application/recommendations/build-recommendation-followup.js';
test('acompanhamento preserva baseline e limita crédito ao tempo recomendado',()=>{
 const feedback=[{id:'f',accepted:true,recommendationId:'r',date:'2026-09-20',activeExamTags:[],snapshot:{recommendedMinutes:30,before:{mastery:40,accuracy:50}},outcome:{state:'positive',measuredAt:'2026-09-25T12:00:00Z',after:{mastery:55,accuracy:65}}}];
 const original=JSON.stringify(feedback),session={id:'s',recommendationId:'r',date:'2026-09-21',durationSeconds:2400};
 const row=buildRecommendationFollowup({feedback,sessions:[session,session],today:'2026-09-29'}).rows[0];
 assert.equal(row.execution.adherence,100);assert.equal(row.execution.excessMinutes,10);assert.equal(row.state,'positive');assert.equal(JSON.stringify(feedback),original);
});
test('sessão após a medição no mesmo dia não aumenta a execução auditada',()=>{
 const feedback=[{id:'f',accepted:true,recommendationId:'r',activeExamTags:[],snapshot:{recommendedMinutes:30},outcome:{measuredAt:'2026-09-25T12:00:00Z'}}];
 const sessions=[{id:'s',recommendationId:'r',date:'2026-09-25',endedAt:'2026-09-25T13:00:00Z',durationSeconds:1800}];
 assert.equal(buildRecommendationFollowup({feedback,sessions,today:'2026-09-29'}).rows[0].execution.executedMinutes,null);
});
test('dados ausentes não viram piora nem tempo zero',()=>{
 const row=buildRecommendationFollowup({feedback:[{id:'f',accepted:true,activeExamTags:[],outcome:{state:'negative'}}],sessions:[{id:'unrelated',date:'2026-09-20',durationSeconds:300}]}).rows[0];
 assert.equal(row.state,'insufficient');assert.equal(row.execution.executedMinutes,null);
});
