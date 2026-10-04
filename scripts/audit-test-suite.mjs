import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const files=['unit','e2e'].flatMap(layer=>readdirSync(resolve(root,`tests/${layer}`)).filter(name=>name.endsWith(layer==='unit'?'.test.js':'.spec.js')).map(name=>`tests/${layer}/${name}`)).sort();
const evidence=JSON.parse(read('tests/config/runtime-evidence.json'));
const areas=[['recovery','Recuperação'],['adherence','Aderência'],['sustainability','Sustentabilidade'],['capacity','Capacidade'],['projection','Trajetória'],['exam','Inteligência da prova'],['demo','Demo'],['session','Sessões'],['weekly-close','Fechamento'],['planning','Planejamento'],['plan','Planejamento'],['date','Datas'],['clock','Datas'],['backup','Backup'],['storage','Persistência'],['state','Estado'],['performance','Desempenho'],['goal','Metas'],['onboarding','Onboarding'],['visual','Visual'],['responsive','Responsividade'],['recommend','Recomendações'],['review','Revisões']];
const critical=/recovery|transaction|snapshot|history|historical|date|clock|backup|migration|storage|state|execution|reconciliation|capacity|availability|adherence|planning|replan|import|scope|priority|coherence/;
const inventory=files.map(file=>{
  const source=read(file),name=file.split('/').at(-1),layer=file.includes('/unit/')?'node':'browser';
  const timed=evidence.e2eCases.filter(row=>row.file===file);
  const imports=[...source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(match=>match[1]);
  const snapshots=/toHaveScreenshot|toMatchSnapshot/.test(source);
  return {file,layer,area:areas.find(([pattern])=>name.includes(pattern))?.[1]||'Aplicação',
    areaBasis:'filename_hint',criticality:critical.test(name)?'critical':snapshots||/visual|responsive/.test(name)?'visual':'functional',
    roles:[layer==='node'?'contract':'journey',...(/integration/.test(name)?['integration']:[]),...(snapshots?['visual-comparison']:[]),...(/openDemo|generateDemoData|generateDemo/.test(source)?['demo']:[]),...(/setViewportSize|width:/.test(source)?['viewport']:[])],
    imports,staticTestDeclarations:[...source.matchAll(/\btest\s*\(/g)].length,
    staticCountCaveat:'Declarations are not executed cases; loops and builders can generate more tests.',
    measuredCases:timed.length,observedCaseSeconds:timed.length?Math.round(timed.reduce((sum,row)=>sum+row.seconds,0)*10)/10:null,
    durationBasis:timed.length?'sum_of_reported_case_times_not_wall_clock':'not_measured_per_file',
    snapshotPlatform:/process\.platform\s*===?\s*['"]win32/.test(source)?'windows-only':snapshots?'inspect-platform-baselines':'none',
    currentGates:layer==='node'?['npm test','check','check:all','CI checks UTC/SP']:['test:e2e','check:all','CI E2E UTC',...(read('package.json').includes(file)?['CI E2E SP subset']:[])],
    stability:'not_assessed',removalDecision:'retain_pending_contract_review'};
});
const output={schemaVersion:1,baselineCommit:evidence.baselineCommit,inventoryScope:'Executable test files directly under tests/unit and tests/e2e; fixtures/helpers are support files.',inventory};
const json=JSON.stringify(output,null,2)+'\n';
const rows=inventory.map(row=>`| ${row.file} | ${row.layer} | ${row.area} | ${row.criticality} | ${row.observedCaseSeconds??'—'} | ${row.roles.join(', ')} | ${row.snapshotPlatform} |`);
const md=`# Inventário da suíte de testes\n\nGerado por \`node scripts/audit-test-suite.mjs\`. Base medida: \`${evidence.baselineCommit}\`.\n\n${inventory.filter(row=>row.layer==='node').length} arquivos Node e ${inventory.filter(row=>row.layer==='browser').length} arquivos E2E. Integrações existentes estão em tests/unit; não há uma suíte de integração separada.\n\n## Tempos observados\n\n| Grupo | Casos | Tempo |\n|---|---:|---:|\n${evidence.groups.map(group=>`| ${group.name} | ${group.cases} | ${group.seconds} s |`).join('\n')}\n\nMedições locais em Windows, não tempos do GitHub Actions. Duração por arquivo E2E é a soma dos tempos reportados dos casos; não somar para obter duração total, pois há dois workers. Unitários têm somente tempo agregado, não medição por arquivo. Valores arredondados do reporter não são benchmarks precisos. Fixtures e helpers não contam como testes executáveis.\n\n## Arquivos\n\nÁrea e criticidade são indicações iniciais pelo nome; o contrato e os imports devem ser revistos antes de eliminar cobertura. Declarações estáticas não equivalem ao número de casos executados. Estabilidade/flakiness não foi inferida de uma única execução.\n\n| Arquivo | Runner | Área sugerida | Criticidade | Segundos observados | Papéis | Screenshot |\n|---|---|---|---|---:|---|---|\n${rows.join('\n')}\n\n## Sobreposições a investigar\n\n| Família | Responsabilidades a separar | Decisão inicial |\n|---|---|---|\n| recovery-transaction / recovery-plan / achievement-projection / recovery-preview-ux | Invariantes e atomicidade; confirmação e aplicação; apresentação mobile | Preservar, separar jornada de matriz |\n| adherence-model / weekly-adherence / adherence / planning-sustainability | Cálculo; integração do fechamento; navegação e leitura | Preservar contratos, selecionar jornadas |\n| responsive / final-visual-polish / visual-density / refinement-visual | Overflow global; densidade da Demo; comparação de pixels | Matriz extensa candidata a Full |\n| strategic-cycle / study-action-cycle / daily-execution / sessions | Ciclo estratégico; entrada da ação; registro e vínculo | Rever sobreposição sem apagar jornadas |\n| legacy-backup / backup-schema24-cycle / testes de estado | Migrações; ciclo de exportação/restauração; normalização | Preservar proteção de integridade |\n\nNenhum teste foi removido. Sem prova de redundância exata, as famílias acima são candidatas à revisão, não classificações REMOVE. Alguns screenshots são condicionados a Windows e não comparam pixels no CI Ubuntu; inventariar baselines Linux antes de afirmar proteção visual remota.\n`;
for(const [path,contents] of [['tests/config/test-inventory.json',json],['docs/TEST-SUITE-INVENTORY.md',md]]){
  if(process.argv.includes('--check')){
    if(read(path)!==contents)throw Error(`${relative(root,resolve(root,path))} desatualizado; execute node scripts/audit-test-suite.mjs`);
  }else writeFileSync(resolve(root,path),contents);
}
console.log(`Inventário ${process.argv.includes('--check')?'validado':'gerado'}: ${inventory.length} arquivos.`);
