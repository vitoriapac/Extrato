import {selectComparableWeeks} from './select-comparable-weeks.js';
import {buildCapacityPattern} from './build-capacity-pattern.js';
import {buildExecutionPattern} from './build-execution-pattern.js';
import {SUSTAINABILITY_POLICY as policy} from '../../domain/planning/sustainability-policy.js';
import {sustainabilityStatus} from './sustainability-status.js';
import {buildSustainabilityInsights} from './build-sustainability-insights.js';

// Consumes reconciled evidence only. No session matching, persistence or recommendations.
export function buildSustainabilityModel(input={}){
  const selection=selectComparableWeeks(input),comparableWeeks=selection.weeks.filter(week=>week.comparable).length;
  const model={version:1,policy:{...policy,historyWindows:[...policy.historyWindows]},...selection,
    state:selection.state==='invalid_period'?'invalid_period':comparableWeeks>=policy.minimumComparableWeeks?'ready':'insufficient_data',
    evidence:{comparableWeeks,requestedWeeks:selection.historyWeeks,level:comparableWeeks>=policy.confirmedComparableWeeks?'confirmed':comparableWeeks>=policy.minimumComparableWeeks?'preliminary':'insufficient'},
    capacity:buildCapacityPattern(selection.weeks),execution:buildExecutionPattern(selection.weeks)};
  model.assessment=sustainabilityStatus(model);model.insights=buildSustainabilityInsights(model);return model;
}
