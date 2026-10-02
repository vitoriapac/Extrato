import {buildAchievementProjection} from './build-achievement-projection.js';
import {daysBetweenCalendarDates} from './projection-status.js';

const validNumber=value=>typeof value==='number'&&Number.isFinite(value);
const planFit=(capacity,planned)=>planned==null?null:{plannedMinutes:planned,availableMinutes:capacity,
  remainingMinutes:Math.max(0,capacity-planned),shortfallMinutes:Math.max(0,planned-capacity)};

// Pure calculation. The clone prevents any future engine from changing the live inputs.
export function simulateProjectionScenario({baseline,scenario}={}) {
  if(!baseline||!scenario)return {state:'invalid',reason:'Cenário incompleto.'};
  const source=structuredClone(baseline),changes=structuredClone(scenario);
  const targetScore=changes.targetScore,examDate=changes.examDate,weeklyCapacityMinutes=changes.weeklyCapacityMinutes;
  if(!validNumber(targetScore)||targetScore<1||targetScore>100
    ||daysBetweenCalendarDates(source.today,examDate)==null||daysBetweenCalendarDates(source.today,examDate)<0
    ||!validNumber(weeklyCapacityMinutes)||weeklyCapacityMinutes<0||weeklyCapacityMinutes>10080)
    return {state:'invalid',reason:'Informe uma meta entre 1% e 100%, uma data futura e até 168 horas semanais.'};
  const current=source.model||buildAchievementProjection(source.inputs);
  const simulated=buildAchievementProjection({...source.inputs,targetScore,examDate});
  return {state:'ready',current:{status:current.status,targetScore:current.current.targetScore,
    examDate:current.exam.date,daysRemaining:current.exam.daysRemaining,
    weeklyCapacityMinutes:source.weeklyCapacityMinutes,planFit:planFit(source.weeklyCapacityMinutes,source.plannedMinutes)},
    simulated:{status:simulated.status,targetScore,examDate,daysRemaining:simulated.exam.daysRemaining,
      weeklyCapacityMinutes,planFit:planFit(weeklyCapacityMinutes,source.plannedMinutes)},
    note:'A capacidade mostra apenas se a carga do plano atual cabe nas horas informadas. Não prevê ganho de nota.',
    projection:simulated};
}
