import {HELP_CATEGORIES,HELP_GLOSSARY,HELP_FAQ} from './help-content.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const paragraph=value=>`<p>${escapeHtml(value)}</p>`;

function renderEntry(entry){
  const content=[
    ...(entry.paragraphs||[]).map(paragraph),
    entry.steps?.length?`<ol class="help-steps">${entry.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol>`:'',
    entry.flow?.length?`<div class="help-flow" aria-label="Fluxo resumido">${entry.flow.map((step,index)=>`<div>${escapeHtml(step)}</div>${index<entry.flow.length-1?'<span aria-hidden="true">→</span>':''}`).join('')}</div>`:'',
    entry.bullets?.length?`<ul class="help-bullets">${entry.bullets.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>`:'',
    entry.note?`<p class="help-note">${escapeHtml(entry.note)}</p>`:'',
    entry.action?`<button type="button" class="btn ghost small help-action" data-help-action="${escapeHtml(entry.action.target)}">${escapeHtml(entry.action.label)}</button>`:''
  ].join('');
  return `<details class="help-topic" id="${escapeHtml(entry.id)}" data-help-topic><summary><span><h4>${escapeHtml(entry.title)}</h4><small>${escapeHtml(entry.summary)}</small></span><span class="help-chevron" aria-hidden="true">⌄</span></summary><div class="help-topic-body">${content}</div></details>`;
}

function renderCategory(category,index){
  return `<details class="help-group" id="${escapeHtml(category.id)}" data-help-group ${index===0?'open':''}><summary><span class="help-group-marker" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span><h3>${escapeHtml(category.title)}</h3><small>${escapeHtml(category.summary)}</small></span><span class="help-chevron" aria-hidden="true">⌄</span></summary><div class="help-group-body">${category.entries.map(renderEntry).join('')}</div></details>`;
}

export function renderHelpCenter({categories=HELP_CATEGORIES,glossary=HELP_GLOSSARY,faq=HELP_FAQ}={}){
  return `<header class="help-hero"><span class="section-eyebrow">Instruções · Central de Ajuda</span><h2>Como usar o StudyTrack</h2><p>O StudyTrack transforma seu histórico de estudos, desempenho e informações da prova em prioridades e próximas ações. Use este guia para conhecer os recursos e entender como trabalham juntos.</p><label class="help-search-label" for="helpSearch">O que você quer aprender?</label><input id="helpSearch" class="select-control help-search" type="search" autocomplete="off" placeholder="Busque por impacto, revisão, backup..." aria-controls="helpGroups"><p class="help-search-status" id="helpSearchStatus" role="status" aria-live="polite"></p></header>
  <nav class="help-category-nav" aria-label="Categorias da ajuda">${categories.map(item=>`<button type="button" data-help-category="${escapeHtml(item.id)}" aria-controls="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>`).join('')}</nav>
  <div id="helpGroups" class="help-groups">${categories.map(renderCategory).join('')}</div>
  <p class="help-no-results" id="helpNoResults" hidden>Nenhum assunto encontrado. Tente outra palavra ou limpe a busca.</p>
  <section class="help-reference" id="guide-glossary"><h3>Glossário</h3><p>Definições curtas para consultar quando um indicador aparecer.</p><div class="help-reference-list">${glossary.map(([term,meaning])=>`<details><summary>${escapeHtml(term)}</summary>${paragraph(meaning)}</details>`).join('')}</div></section>
  <section class="help-reference" id="guide-faq"><h3>Dúvidas frequentes</h3><div class="help-reference-list">${faq.map(([question,answer])=>`<details><summary>${escapeHtml(question)}</summary>${paragraph(answer)}</details>`).join('')}</div></section>`;
}
