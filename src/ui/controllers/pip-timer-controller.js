// Tab title while a session exists: the timer stays readable from any other tab or window.
export function formatTimerTitle({started=false,running=false,time='',subjectName='',baseTitle}){
  if(!started)return baseTitle;
  return `${running?'▶':'⏸'} ${time}${subjectName?` · ${subjectName}`:''} — StudyTrack`;
}
