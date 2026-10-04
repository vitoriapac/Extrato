import {buildHelpSearchIndex} from './help-search.js';
import {renderHelpVisual} from './help-visuals.js';
import {HELP_CATEGORIES,HELP_GLOSSARY,HELP_FAQ} from './help-content.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const paragraph=value=>`<p>${escapeHtml(value)}</p>`;

function renderEntry(entry){
  const content=[
    renderHelpVisual(entry.visual),
    ...(entry.paragraphs||[]).map(paragraph),
    entry.steps?.length?`<ol class="help-timeline">${entry.steps.map(step=>`<li><span>${escapeHtml(typeof step==='string'?step:step.title)}</span>${typeof step==='object'&&step.detail?`<small>${escapeHtml(step.detail)}</small>`:''}</li>`).join('')}</ol>`:'',
    entry.flow?.length?`<div class="help-flow" aria-label="Fluxo resumido">${entry.flow.map((step,index)=>`<span class="help-flow-step">${escapeHtml(step)}</span>${index<entry.flow.length-1?'<span class="help-flow-arrow" aria-hidden="true">→</span>':''}`).join('')}</div>`:'',
    entry.bullets?.length?`<ul class="help-bullets">${entry.bullets.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>`:'',
    entry.note?`<aside class="help-note context-note context-note--tip"><strong>Dica</strong>${paragraph(entry.note)}</aside>`:'',
    entry.action?`<button type="button" class="help-text-link" data-help-action="${escapeHtml(entry.action.target)}">${escapeHtml(entry.action.label)} <span aria-hidden="true">→</span></button>`:''
  ].join('');
  return `<article class="help-topic${entry.wide?' instruction-card--wide':''} instruction-card instruction-card--${['feature','concept','reference'].includes(entry.kind)?entry.kind:'feature'}${entry.steps?.length?' help-topic--steps':''}" id="${escapeHtml(entry.id)}" data-help-topic data-help-search="${escapeHtml(buildHelpSearchIndex(entry))}"><h4>${escapeHtml(entry.title)}</h4><p class="help-topic-summary">${escapeHtml(entry.summary)}</p><div class="help-topic-body">${content}</div></article>`;
}

function renderCategory(category,index){
  return `<section class="help-group instruction-section" id="${escapeHtml(category.id)}" data-help-group tabindex="-1"><header class="help-group-heading"><span class="help-group-marker" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h3>${escapeHtml(category.title)}</h3><p>${escapeHtml(category.summary)}</p></div></header><div class="help-group-body instruction-card-grid">${category.entries.map(renderEntry).join('')}</div></section>`;
}

const renderReference=(id,title,description,items)=>`<section class="help-reference" id="${id}"><h3>${title}</h3>${description?paragraph(description):''}<div class="help-reference-list">${items.map(([term,meaning])=>`<article class="help-reference-item instruction-card instruction-card--reference"><h4>${escapeHtml(term)}</h4>${paragraph(meaning)}</article>`).join('')}</div></section>`;
const renderCard=(category,index)=>`<div class="help-guide-card"><button type="button" class="help-category-link" data-help-category="${escapeHtml(category.id)}" aria-controls="${escapeHtml(category.id)}" ${index===0?'aria-current="location"':''}>${escapeHtml(category.title)}</button></div>`;

export function renderHelpCenter({categories=HELP_CATEGORIES,glossary=HELP_GLOSSARY,faq=HELP_FAQ}={}){
  return `<header class="help-hero"><div class="module-heading"><span class="module-heading__eyebrow">Instruções · Central de Ajuda</span><h2 class="module-heading__title">Como usar o StudyTrack</h2><p class="module-heading__description">O StudyTrack transforma seu histórico de estudos, desempenho e informações da prova em prioridades e próximas ações. Use este guia para conhecer os recursos e entender como trabalham juntos.</p></div><label class="help-search-label" for="helpSearch">O que você quer aprender?</label><div class="help-search-row"><input id="helpSearch" class="select-control help-search" type="search" autocomplete="off" placeholder="Busque por prontidão, revisão, aderência, backup..." aria-controls="helpGroups"><button id="helpSearchClear" class="help-search-clear" type="button" aria-label="Limpar busca das instruções" hidden>Limpar ×</button></div><p class="help-search-status" id="helpSearchStatus" role="status" aria-live="polite"></p></header>
  <nav class="help-card-grid" aria-label="Capítulos da ajuda">${categories.map(renderCard).join('')}</nav>
  <div id="helpGroups" class="help-groups">${categories.map((category,index)=>`${renderCategory(category,index)}${index===2?'<aside class="help-principle" data-help-principle><span class="section-eyebrow">O que torna o StudyTrack diferente</span><h3>Da prova à próxima ação</h3><p>O StudyTrack combina a importância do conteúdo na prova com sua situação de aprendizagem para orientar o próximo estudo.</p><div class="help-principle-flow" aria-label="Prova e situação pessoal levam à prioridade, ação e resultado"><span>Prova</span><span aria-hidden="true">×</span><span>Você</span><span aria-hidden="true">→</span><span>Prioridade</span><span aria-hidden="true">→</span><span>Ação</span><span aria-hidden="true">→</span><span>Resultado</span></div><p>Domínio, retenção, tendência, revisões e evidências ajudam a explicar cada decisão.</p></aside>':''}`).join('')}</div>
  <p class="help-no-results ui-state--empty" id="helpNoResults" role="status" hidden>Nenhum assunto encontrado. Tente outra palavra ou limpe a busca.</p>
  ${renderReference('guide-glossary','Glossário','Definições curtas para consultar quando um indicador aparecer.',glossary)}
  ${renderReference('guide-faq','Dúvidas frequentes','',faq)}`;
}
