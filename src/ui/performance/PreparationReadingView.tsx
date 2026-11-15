import type { PreparationLink, PreparationReading } from '../../application/performance/build-preparation-reading.js';

function LinkButton({ link, solid = false }: { link: PreparationLink; solid?: boolean }) {
  return <button type="button" class={`btn${solid ? '' : ' tertiary'} small`}
    data-performance-investigate={link.kind === 'section' ? link.target : undefined}
    data-performance-subject-id={link.kind === 'section' ? link.subjectId || undefined : undefined}
    data-performance-reveal={link.kind === 'reveal' ? link.target : undefined}
    data-performance-adjust-plan={link.kind === 'plan-adjust' ? '' : undefined}
    data-performance-open={link.kind === 'tab' ? link.target : undefined}>{link.label}</button>;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

/** Faixa projetada de nota e meta numa régua de 0 a 100, abaixo da barra da Prontidão (escalas diferentes, mesmo eixo). */
function ProjectionRuler({ projection }: { projection: NonNullable<PreparationReading['howAmI']['projection']> }) {
  const { low, high, target } = projection;
  const description = `Faixa projetada de nota de ${low}% a ${high}%${target != null ? `, meta de ${target}%` : ''}, em uma escala de 0 a 100`;
  return <div class="performance-reading__ruler" role="img" aria-label={description} data-projection-ruler="true">
    <div class="performance-reading__band">
      <i style={{ left: `${clamp(low)}%`, width: `${Math.max(1, clamp(high) - clamp(low))}%` }} />
      {target != null && <b style={{ left: `${clamp(target)}%` }} />}
    </div>
    <small aria-hidden="true">Faixa projetada {low}% a {high}%{target != null ? ` · meta ${target}%` : ''}</small>
  </div>;
}

export function PreparationReadingView({ reading }: { reading: PreparationReading }) {
  const { howAmI, pulling, whatToDo, evidence, steady = [] } = reading;
  const readiness = howAmI.readiness;
  const action = whatToDo.action;
  return <section class="performance-reading chart-card mb-4" id="bloco-leitura" aria-labelledby="performanceReadingTitle">
    <header class="module-heading module-heading--compact mb-3"><div class="flex flex-wrap items-center justify-between gap-2"><h3 class="module-heading__title" id="performanceReadingTitle">Leitura da preparação</h3></div></header>
    <div class="performance-reading__grid">
      <section class="performance-reading__todo" aria-labelledby="performanceReadingTodo"><h4 id="performanceReadingTodo">O que fazer</h4>
        {action ? <><p class="m-0" data-recommendation-id={action.recommendationId ?? ''}><strong>{action.label}:</strong> {action.text}</p>
          {action.reason && <p class="m-0 performance-reading__support">{action.reason}</p>}
          <p class="performance-reading__facts"><span>No plano: <b>{action.facts.inPlan}</b></span><span>Evidência: <b>{action.facts.evidence}</b></span></p>
          <div class="performance-reading__actions"><LinkButton link={{ kind: 'tab', target: 'hoje', label: 'Abrir em Hoje' }} solid /><LinkButton link={{ kind: 'plan-adjust', target: 'metas', label: 'Ajustar plano' }} />{whatToDo.recovery && <LinkButton link={{ kind: 'reveal', target: 'trajectory', label: 'Ver plano de recuperação' }} />}</div>
        </> : <><p class="m-0">{whatToDo.reason || 'Nenhuma ação indicada agora.'}</p><div class="performance-reading__actions"><LinkButton link={{ kind: 'tab', target: 'hoje', label: 'Abrir Hoje' }} solid /></div></>}
        {whatToDo.deficit && <p class="m-0">{whatToDo.deficit}</p>}
      </section>
      <section class="performance-reading__how" aria-labelledby="performanceReadingHow"><h4 id="performanceReadingHow">Como estou</h4>
        {readiness ? <><p class="m-0"><strong class="performance-reading__figure">Prontidão {readiness.value}/100</strong> <span>calculada agora</span></p><div class="performance-reading__bar" role="img" aria-label={`Prontidão ${readiness.value} em uma escala de 0 a 100`}><i style={{ width: `${Math.max(0, Math.min(100, Number(readiness.value)))}%` }} /></div>{howAmI.projection && <ProjectionRuler projection={howAmI.projection} />}{readiness.verdict && <p class="performance-reading__verdict m-0" data-state={readiness.verdict.state}>{readiness.verdict.text}</p>}{steady.length > 0 && <div class="performance-reading__steady" data-steady="true"><h5 class="m-0">O que já está firme</h5><ul class="m-0">{steady.map(item => <li key={item}>{item}</li>)}</ul></div>}</> : <p class="m-0">Ainda não há dados suficientes para esta leitura.</p>}
      </section>
      <section class="performance-reading__pull" aria-labelledby="performanceReadingPull"><h4 id="performanceReadingPull">O que mais pesa</h4><p class="m-0 performance-reading__support">Pontos de atenção, não a recomendação.</p>
        {pulling.length ? <ol class="performance-reading__list">{pulling.map((item, index) => <li key={index}><span>{item.text}</span>{item.link && <> <LinkButton link={item.link} /></>}</li>)}</ol> : <p class="m-0">Nenhum ponto de atenção com evidência suficiente.</p>}
      </section>
      <section class="performance-reading__support-block" aria-label="Números de apoio">
        {readiness?.detail && <p class="m-0 performance-reading__support">{readiness.detail}</p>}
        {readiness && <p class="m-0 performance-reading__support" data-window-note="true">Janelas diferentes: o ritmo e o que falta são dos últimos 7 dias, a projeção da nota usa simulados dos últimos 90 dias, e os indicadores abaixo seguem o período escolhido.</p>}
        {howAmI.projection && <p class="m-0 performance-reading__support"><span class="performance-window" data-window="ninetyDays" title="Simulados comparáveis dos últimos 90 dias">90 dias</span>{howAmI.projection.text} <button type="button" class="btn ghost small" data-performance-investigate="simulations">Ver em Simulados</button></p>}
      </section>
    </div>{evidence.length > 0 && <ul class="performance-reading__evidence analytics-note">{evidence.map(item => <li key={item}>{item}</li>)}</ul>}
  </section>;
}
