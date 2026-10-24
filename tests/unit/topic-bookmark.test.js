import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTopicBookmark,bookmarkProgress,formatBookmarkLabel} from '../../src/domain/topic-bookmark.js';
import {normalizeTopicStrategy} from '../../src/state/strategic.js';

const now=()=>'2026-10-23T12:00:00.000Z';

test('bookmark válido é normalizado e congelado',()=>{
  const bookmark=normalizeTopicBookmark({resourceType:'pdf',label:'  SFN.pdf ',currentUnit:'42',totalUnits:110,positionText:'',extra:1},{now});
  assert.deepEqual({...bookmark},{resourceType:'pdf',label:'SFN.pdf',currentUnit:42,totalUnits:110,positionText:'',updatedAt:now()});
  assert.ok(Object.isFrozen(bookmark));
});

test('valores inválidos viram padrões seguros',()=>{
  assert.equal(normalizeTopicBookmark({resourceType:'x',positionText:'cap. 2'},{now}).resourceType,'other');
  assert.equal(normalizeTopicBookmark({resourceType:'pdf',currentUnit:50,totalUnits:10},{now}).totalUnits,null);
  assert.equal(normalizeTopicBookmark({resourceType:'pdf',currentUnit:-1,totalUnits:10},{now}),null);
  assert.equal(normalizeTopicBookmark({resourceType:'pdf',currentUnit:'',label:'  ',positionText:''},{now}),null);
  for(const raw of [null,undefined,'pág 3',[],42])assert.equal(normalizeTopicBookmark(raw,{now}),null);
  const long=normalizeTopicBookmark({label:'a'.repeat(200),positionText:'b'.repeat(100)},{now});
  assert.equal(long.label.length,120);assert.equal(long.positionText.length,60);
});

test('progresso e microcopy por tipo',()=>{
  const pdf=normalizeTopicBookmark({resourceType:'pdf',currentUnit:42,totalUnits:110},{now});
  assert.equal(bookmarkProgress(pdf),38);
  assert.equal(bookmarkProgress(normalizeTopicBookmark({resourceType:'pdf',currentUnit:42},{now})),null);
  assert.equal(formatBookmarkLabel(pdf),'PDF · pág. 42 de 110 (38%)');
  assert.equal(formatBookmarkLabel(normalizeTopicBookmark({resourceType:'pdf',currentUnit:42},{now})),'PDF · pág. 42');
  assert.equal(formatBookmarkLabel(normalizeTopicBookmark({resourceType:'pdf',label:'Aula 03 - SFN.pdf',currentUnit:42,totalUnits:110},{now})),'Aula 03 - SFN.pdf · pág. 42 de 110 (38%)');
  assert.equal(formatBookmarkLabel(normalizeTopicBookmark({resourceType:'video',currentUnit:4,totalUnits:12,positionText:'18m30s'},{now})),'Videoaula · aula 4 de 12 · 18m30s');
  assert.equal(formatBookmarkLabel(normalizeTopicBookmark({resourceType:'law',positionText:'Art. 37, § 6º'},{now})),'Lei seca · Art. 37, § 6º');
  assert.equal(formatBookmarkLabel(normalizeTopicBookmark({resourceType:'other',label:'Caderno',positionText:'cap. 2'},{now})),'Caderno · cap. 2');
  assert.equal(formatBookmarkLabel(null),'');
});

test('normalizeTopicStrategy mantém bookmark válido e põe null em tópico antigo',()=>{
  assert.equal(normalizeTopicStrategy({id:'t1',name:'Antigo'}).bookmark,null);
  const topic=normalizeTopicStrategy({id:'t2',bookmark:{resourceType:'law',positionText:'Art. 5º',updatedAt:now()}});
  assert.equal(topic.bookmark.positionText,'Art. 5º');assert.equal(topic.bookmark.updatedAt,now());
  assert.equal(normalizeTopicStrategy({id:'t3',bookmark:{currentUnit:'abc'}}).bookmark,null);
});
