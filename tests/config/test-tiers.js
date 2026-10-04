import {readFileSync} from 'node:fs';

export const TEST_TIERS=Object.freeze(['FAST_GATE','REGRESSION','FULL']);
export const testTierManifest=JSON.parse(readFileSync(new URL('./test-tiers.json',import.meta.url),'utf8'));

// Files require an explicit classification. New browser cases in an already
// classified file remain FULL unless a named journey is promoted for review.
export function classifyTest(file,title){
  const entry=testTierManifest.files.find(row=>row.file===file.replaceAll('\\','/'));
  if(!entry)throw new Error(`Teste sem classificação: ${file}`);
  return entry.promotions?.find(row=>row.title===title)?.tier||entry.tier;
}

export function selectBrowserCases(gate,cases){
  const rank=TEST_TIERS.indexOf(gate);
  if(rank<0)throw new Error(`Gate desconhecido: ${gate}`);
  return cases.filter(row=>TEST_TIERS.indexOf(classifyTest(row.file,row.title))<=rank);
}
