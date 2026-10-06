import {escapePresentationText as escape} from './presentation.js';
export {renderSectionHeader,renderMetricCard,renderEmptyState} from './presentation.js';
export {presentEvidence} from '../evidence-state.js';
export {renderDecisionExplanation} from './decision-explanation.js';

// Plain text is escaped here. HTML slots only accept output from trusted renderers.
export function renderDisclosure({title,contentHTML='',className='performance-details',bodyClassName='performance-details__body',open=false}={}){
 return `<details class="${escape(className)}"${open?' open':''}><summary>${escape(title)}</summary><div class="${escape(bodyClassName)}">${contentHTML}</div></details>`;
}
export function renderDecisionSummary({title,summary,details=[]}={}){
 return `<section class="performance-story" aria-label="Leitura principal"><span class="performance-story__eyebrow">O que observar</span><h3>${escape(title)}</h3><p>${escape(summary)}</p>${details.length?`<ul>${details.slice(0,3).map(text=>renderInsightCard({text,tag:'li'})).join('')}</ul>`:''}</section>`;
}
export function renderInsightCard({title='',text='',tag='article',className=''}={}){
 if(!['article','aside','li'].includes(tag))throw new TypeError('Unsupported insight element');
 return `<${tag}${className?` class="${escape(className)}"`:''}>${title?`<strong>${escape(title)}</strong>`:''}${escape(text)}</${tag}>`;
}
export function renderTrendIndicator({label,state,className='trend-indicator'}={}){
 if(!/^[a-z][a-z0-9_-]*$/.test(state||''))throw new TypeError('Invalid presentation state');
 return `<span class="${escape(className)} is-${escape(state)}">${escape(label)}</span>`;
}
export function renderAction({label,href=null,attributes={},className='btn ghost small',disabled=false}={}){
 if(href!==null&&(typeof href!=='string'||!href.startsWith('#')))throw new TypeError('Presentation links must identify a local destination');
 const attrs=Object.entries(attributes).map(([key,value])=>{
  if(!/^(?:data-[a-z0-9-]+|aria-[a-z-]+|id)$/.test(key))throw new TypeError('Unsupported presentation attribute');
  return ` ${key}="${escape(value)}"`;
 }).join('');
 return href!==null?`<a class="${escape(className)}" href="${escape(href)}"${attrs}>${escape(label)}</a>`:`<button type="button" class="${escape(className)}"${attrs}${disabled?' disabled':''}>${escape(label)}</button>`;
}
export function renderActionCard({contentHTML='',actions=[],className='action-card'}={}){
 return `<section class="${escape(className)}">${contentHTML}${actions.map(renderAction).join('')}</section>`;
}
export function renderContextualHelp(topic,label){
 if(!/^[a-z][a-z0-9-]*$/.test(topic||''))throw new TypeError('Invalid help topic');
 return `<span class="analytical-contextual-help">${renderAction({label,attributes:{'data-help-topic-link':topic}})}</span>`;
}

// HTML slots accept only trusted renderer output, like renderDisclosure.
export function renderActionGroup({actions=[],contentHTML='',label='',vertical=false}={}){
 return `<div class="action-group${vertical?' action-group--vertical':''}"${label?` role="group" aria-label="${escape(label)}"`:''}>${actions.map(renderAction).join('')}${contentHTML}</div>`;
}
export function renderDivider({section=false}={}){
 return `<div class="${section?'section-divider':'divider'}" aria-hidden="true"></div>`;
}
