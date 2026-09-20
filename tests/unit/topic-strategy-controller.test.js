import test from 'node:test';
import assert from 'node:assert/strict';
import {createTopicStrategyController} from '../../src/features/topic-strategy/topic-strategy-controller.js';

function fixture(){
  const subject={id:'s1'},topic={id:'t1',examImportance:null,estimatedStudyMinutes:null,prerequisites:[],fieldOrigins:{}};
  const other={id:'t2',prerequisites:[]},updates=[];let invalidations=0,changes=0,cycles=0;
  const controller=createTopicStrategyController({findTopic:id=>id==='t1'?{subject,topic}:null,listTopics:()=>[topic,other],subjectService:{updateTopic:(...args)=>{updates.push(args);Object.assign(topic,args[2])}},normalizeTopic:value=>value,invalidatePlan:()=>invalidations++,onChanged:()=>changes++,onCycle:()=>cycles++});
  return{topic,other,updates,controller,counts:()=>({invalidations,changes,cycles})};
}

test('controller atualiza estratégia, marca origem manual e invalida o plano',()=>{const f=fixture();assert.equal(f.controller.update('s1','t1','examImportance','75'),true);assert.equal(f.topic.examImportance,.75);assert.equal(f.topic.fieldOrigins.examImportance,'manual');assert.deepEqual(f.counts(),{invalidations:1,changes:1,cycles:0})});
test('controller altera pré-requisito e impede ciclo',()=>{const f=fixture();assert.equal(f.controller.togglePrerequisite('s1','t1','t2',true),true);assert.deepEqual(f.topic.prerequisites,['t2']);f.other.prerequisites=['t1'];f.topic.prerequisites=[];assert.equal(f.controller.togglePrerequisite('s1','t1','t2',true),false);assert.equal(f.counts().cycles,1)});
