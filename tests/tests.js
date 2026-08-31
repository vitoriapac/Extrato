(async()=>{
  'use strict';
  const api=window.__EXTRATO_TEST__;
  const results=[];
  const tests=[];
  const test=(name,fn)=>tests.push({name,fn});
  const assert=(condition,message='Falha de asserção')=>{if(!condition)throw new Error(message)};
  const equal=(actual,expected,message)=>assert(Object.is(actual,expected),message||`Esperado ${expected}; recebido ${actual}`);
  const validScore=value=>Number.isFinite(value)&&value>=0&&value<=100;

  function baseState(){return api.resetState()}
  function cloneState(){return api.structuredCloneSafe(api.getState())}

  test('migra um backup v1 até o schema atual',()=>{
    const migrated=api.migrateState({schemaVersion:1,subjects:[{name:'Português',topics:[{name:'Texto',status:'Não iniciado'}]}]});
    equal(migrated.schemaVersion,api.CURRENT_SCHEMA_VERSION);
    assert(migrated.subjects[0].id.startsWith('subject-'));
    assert(migrated.subjects[0].topics[0].id.startsWith('topic-'));
    assert(Array.isArray(migrated.dailyPlans));
  });

  test('executa as rotas de migração v1 até v8',()=>{
    for(let version=1;version<=api.CURRENT_SCHEMA_VERSION;version++){
      const candidate=cloneState();candidate.schemaVersion=version;
      const migrated=api.migrateState(candidate);
      equal(migrated.schemaVersion,api.CURRENT_SCHEMA_VERSION,`Falha ao migrar a versão ${version}`);
      assert(Array.isArray(migrated.subjects)&&Array.isArray(migrated.dailyPlans),`Estrutura inválida após v${version}`);
    }
  });

  test('mantém um estado do schema atual sem perder IDs',()=>{
    const current=cloneState(),subjectId=current.subjects[0].id,topicId=current.subjects[0].topics[0].id;
    const migrated=api.migrateState(current);
    equal(migrated.subjects[0].id,subjectId);equal(migrated.subjects[0].topics[0].id,topicId);
  });

  test('aceita backup estruturalmente válido',()=>{
    const validation=api.validateBackupData(cloneState());
    assert(validation.valid,validation.message);
    equal(validation.normalized.schemaVersion,api.CURRENT_SCHEMA_VERSION);
  });

  test('rejeita ID malicioso na importação',()=>{
    const payload=cloneState();payload.subjects[0].id="x');alert(1)//";
    const validation=api.validateBackupData(payload);
    assert(!validation.valid,'Um ID executável foi aceito');
  });

  test('rejeita IDs duplicados',()=>{
    const payload=cloneState();payload.subjects.push(api.structuredCloneSafe(payload.subjects[0]));
    const validation=api.validateBackupData(payload);
    assert(!validation.valid,'IDs duplicados foram aceitos');
  });

  test('rejeita referência para disciplina inexistente',()=>{
    const payload=cloneState();payload.calendar.push({id:'calendar-test',date:'2026-08-30',week:'',subjectId:'subject-inexistente',topicId:null,status:'Não iniciado',reviewType:'—'});
    const validation=api.validateBackupData(payload);
    assert(!validation.valid,'Referência quebrada foi aceita');
  });

  test('calcula SHA-256 conhecido',async()=>{
    const hash=await api.sha256('abc');
    if(hash===null)return {skip:'Web Crypto indisponível neste contexto'};
    equal(hash,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  test('grava, lê e remove valor isolado no repositório',async()=>{
    const key='extrato-test-'+Date.now(),value=JSON.stringify({updatedAt:new Date().toISOString(),ok:true});
    try{assert(await api.StorageManager.set(key,value));equal(await api.StorageManager.get(key),value)}
    finally{await api.StorageManager.remove(key)}
    equal(await api.StorageManager.get(key),null);
  });

  test('mantém snapshots rotativos e metadados de integridade',async()=>{
    const prefix='extrato-test-backup-'+Date.now(),indexKey=prefix+'-index';
    try{
      for(let version=1;version<=3;version++){
        const snapshot=cloneState();snapshot.updatedAt=new Date(Date.now()+version*1000).toISOString();snapshot.testVersion=version;
        assert(await api.rotateAutomaticBackup(JSON.stringify(snapshot),{backupKey:prefix,indexKey,slotCount:2}));
      }
      const index=JSON.parse(await api.StorageManager.get(indexKey));
      equal(index.snapshots.length,2);assert(index.snapshots.every(item=>item.key&&item.createdAt&&item.bytes>0));
      if(window.crypto?.subtle)assert(index.snapshots.every(item=>/^[a-f0-9]{64}$/.test(item.checksum)));
      const latestRaw=await api.StorageManager.get(index.snapshots[0].key),restoration=api.validateBackupData(JSON.parse(latestRaw));
      assert(restoration.valid,restoration.message||'Snapshot não pôde ser restaurado');
    }finally{
      await api.StorageManager.remove(indexKey);await api.StorageManager.remove(prefix+'-0');await api.StorageManager.remove(prefix+'-1');
    }
  });

  test('calcula corretamente semana iniciada na segunda-feira',()=>{
    equal(api.startOfWeek('2026-08-30'),'2026-08-24');
    equal(api.startOfWeek('2026-08-31'),'2026-08-31');
  });

  test('soma datas em viradas de mês e ano',()=>{
    equal(api.addDays('2026-12-31',1),'2027-01-01');
    equal(api.addDays('2028-02-28',1),'2028-02-29');
    equal(api.addDays('2018-11-03',1),'2018-11-04');
  });

  test('não converte revisão ausente para a data Unix de 1970',()=>{
    equal(api.localDateFromTimestamp(null),'');
    equal(api.localDateFromTimestamp(undefined),'');
    equal(api.localDateFromTimestamp(''),'');
    const current=baseState(),topic=current.subjects[0].topics[0];
    topic.lastReviewedAt=null;
    const retention=api.topicRetentionScore(current.subjects[0].id,topic.id);
    assert(!retention.detail.includes('20696d'),retention.detail);
    assert(retention.detail.includes('Sem revisões')||retention.detail.includes('sem revisão'),retention.detail);
  });

  test('nova disciplina exige confirmação e aceita Esc para cancelar',async()=>{
    const current=baseState(),initialCount=current.subjects.length,button=document.getElementById('addSubjectBtn');
    document.getElementById('tab-disciplinas').click();
    button.focus();
    button.click();
    await new Promise(resolve=>requestAnimationFrame(resolve));
    equal(current.subjects.length,initialCount,'A disciplina foi criada antes da confirmação');
    assert(document.getElementById('modalOverlay').classList.contains('show'),'Modal não abriu');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    equal(current.subjects.length,initialCount);
    assert(!document.getElementById('modalOverlay').classList.contains('show'),'Esc não fechou o modal');
    equal(document.activeElement,button,'O foco não voltou ao botão de origem');
  });

  test('encurta revisão quando o desempenho é crítico',()=>{
    const result=api.calculateAdaptiveInterval({baseDays:10,accuracy:40,volume:20,target:70});
    equal(result.days,7);assert(result.reason.includes('abaixo de 50%'));
  });

  test('alonga revisão com desempenho e histórico consistentes',()=>{
    const result=api.calculateAdaptiveInterval({baseDays:10,accuracy:90,volume:30,target:70,trendKey:'up',reviews:4});
    assert(result.days>10);assert(result.days<=15);
  });

  test('sincroniza questões originadas de uma sessão',()=>{
    const current=baseState(),subject=current.subjects[0],topic=subject.topics[0];
    const session={id:'session-test',date:'2026-08-30',durationSeconds:1800,subjectId:subject.id,topicId:topic.id,type:'questions',questionsResolved:20,correctAnswers:15,notes:''};
    current.studySessions.push(session);api.syncQuestionFromStudySession(session);
    const question=current.questoes.find(item=>item.studySessionId===session.id);
    assert(question);equal(question.resolved,20);equal(question.correct,15);equal(question.topicId,topic.id);
    session.questionsResolved=0;api.syncQuestionFromStudySession(session);
    assert(!current.questoes.some(item=>item.studySessionId===session.id));
  });

  test('detecta dependências que impedem exclusão',()=>{
    const current=baseState(),subject=current.subjects[0],topic=subject.topics[0];
    current.questoes.push({id:'question-dependency',date:'2026-08-30',subjectId:subject.id,topicId:topic.id,resolved:10,correct:5,errorBreakdown:{}});
    equal(api.getTopicDependencies(topic.id).questions,1);
    assert(api.getSubjectDependencies(subject.id).questoes>=1);
  });

  test('mantém métricas de aprovação dentro de 0–100',()=>{
    const current=baseState(),subject=current.subjects[0],topic=subject.topics[0];
    topic.status='Concluído';topic.completedAt='2026-08-20';topic.firstCompletedAt='2026-08-20T12:00:00.000Z';topic.lastCompletedAt=topic.firstCompletedAt;
    current.questoes.push({id:'question-metric',date:'2026-08-30',subjectId:subject.id,topicId:topic.id,resolved:100,correct:80,errorBreakdown:{}});
    current.simulados.push({id:'simulation-metric',date:'2026-08-30',nome:'Teste',correct:80,total:100,breakdown:[]});
    const metrics=api.computeApprovalMetrics();
    ['conhecimento','retencao','questoes','simulados','consistencia'].forEach(key=>assert(validScore(metrics[key].score),`Score inválido: ${key}`));
    assert(validScore(api.indiceProntidao(metrics)));
  });

  test('ordena prioridades por score decrescente',()=>{
    const current=baseState(),subject=current.subjects[0],topic=subject.topics[0];topic.name='Conteúdo pendente';topic.status='Não iniciado';
    const priorities=api.computeStudyPriorities();assert(priorities.length>0);
    assert(priorities.every(item=>validScore(item.score)));
    for(let index=1;index<priorities.length;index++)assert(priorities[index-1].score>=priorities[index].score);
  });

  function renderReport(){
    const passed=results.filter(item=>item.status==='passed').length,failed=results.filter(item=>item.status==='failed').length,skipped=results.filter(item=>item.status==='skipped').length;
    const panel=document.createElement('section');panel.id='testReport';panel.style.cssText='position:fixed;inset:16px;z-index:10000;overflow:auto;background:var(--paper);color:var(--ink);border:2px solid var(--gold);padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.35);font:14px IBM Plex Mono,monospace';
    const items=results.map(item=>`<li style="margin:8px 0;color:${item.status==='failed'?'var(--red)':item.status==='skipped'?'var(--amber)':'var(--green)'}">${item.status==='failed'?'✕':item.status==='skipped'?'○':'✓'} ${escapeText(item.name)}${item.detail?` — ${escapeText(item.detail)}`:''}</li>`).join('');
    panel.innerHTML=`<h1 style="font:600 24px Fraunces,serif">Testes automatizados</h1><p><strong>${passed} passaram</strong> · ${failed} falharam · ${skipped} ignorados</p><ol>${items}</ol><p>Execute novamente recarregando esta página com <code>?test=1</code>.</p>`;
    document.body.appendChild(panel);document.title=`${failed?'FALHA':'OK'} — Testes do Extrato`;
  }
  function escapeText(value){const element=document.createElement('span');element.textContent=String(value);return element.innerHTML}

  if(!api)throw new Error('API de testes não foi inicializada.');
  for(const item of tests){
    try{const outcome=await item.fn();results.push({name:item.name,status:outcome?.skip?'skipped':'passed',detail:outcome?.skip||''})}
    catch(error){results.push({name:item.name,status:'failed',detail:error.message});console.error('Teste falhou:',item.name,error)}
  }
  api.resetState();renderReport();
})();
