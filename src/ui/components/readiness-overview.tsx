import type { JSX } from 'preact';
import { renderScoreProjectionEvidence } from '../renderers/score-projection-renderer.js';
import { renderProjectionCalibration } from '../renderers/projection-calibration-renderer.js';
import { renderContextualHelp, renderActionGroup } from './analytical-presentation.js';

type AnyRecord = Record<string, any>;

export interface ReadinessOverviewViewProps {
  m: AnyRecord;
  level: AnyRecord;
  confidence: AnyRecord;
  projection: AnyRecord;
  projectionHistory: any;
  factors: Array<[string, AnyRecord]>;
  approvalState: string;
  approvalLabel: string;
  diagnostics: string[];
  candidates: any;
  getMetricDataState: (item: AnyRecord) => string;
  metricStateLabel: (item: AnyRecord) => string;
}

/** Fragmento já montado por sub-renderizadores (ajuda, evidência, calibração); não contém entrada do usuário sem escape. */
function Raw({ html }: { html: string }): JSX.Element | null {
  return html ? <span class="raw-html" dangerouslySetInnerHTML={{ __html: html }} /> : null;
}

function levelTone(approvalState: string, level: AnyRecord): string {
  if (approvalState !== 'ready') return 'neutral';
  return level.cor === 'danger' ? 'warn' : level.cor;
}

function FactorBar({
  label,
  item,
  dataState,
  stateLabel,
}: {
  label: string;
  item: AnyRecord;
  dataState: string;
  stateLabel: string;
}): JSX.Element {
  const empty = dataState === 'empty';
  const score = empty ? 0 : item.score;
  return (
    <div class={`bar-row metric-row metric-row--${dataState}`} title={item.detail}>
      <div class="bar-label">
        {label}
        <small>{stateLabel}</small>
      </div>
      <div
        class="bar-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-valuetext={empty ? 'aguardando dados' : `${item.score}%`}
      >
        <div class="bar-fill" style={`width:${score}%`} />
      </div>
      <div class="bar-pct">{empty ? '—' : `${item.score}%`}</div>
    </div>
  );
}

function projectionGapText(projection: AnyRecord): string {
  if (projection.calibration.status === 'above')
    return `A faixa atual está acima da meta de ${projection.gap.target}%.`;
  if (projection.gap.minimum === 0) return `A meta de ${projection.gap.target}% está dentro da faixa atual.`;
  return `Gap estimado até a meta: ${projection.gap.minimum}–${projection.gap.maximum} p.p.`;
}

function forecastText(projection: AnyRecord): string {
  const f = projection.forecast30;
  if (!f.available) return String(f.reason ?? '');
  const slope = `${f.slopePerWeek >= 0 ? '+' : ''}${f.slopePerWeek}`;
  return `Média móvel: ${projection.movingAverage}% · tendência ${slope} p.p./semana · evidência da tendência: ${f.confidenceLabel}`;
}

export function ReadinessOverviewView(props: ReadinessOverviewViewProps): JSX.Element {
  const {
    m,
    level,
    confidence,
    projection,
    projectionHistory,
    factors,
    approvalState,
    approvalLabel,
    diagnostics,
    candidates,
    getMetricDataState,
    metricStateLabel,
  } = props;
  const ready = approvalState === 'ready';

  return (
    <>
      <div class={`metric-state metric-state--${approvalState}`}>
        {ready ? approvalLabel : <span>Registre mais atividades para liberar uma classificação definitiva.</span>}
      </div>
      <div class="kpi-grid">
        <div class={`kpi-cell ${levelTone(approvalState, level)}`}>
          <div class="n kpi-level">{ready ? level.nivel : approvalLabel}</div>
          <div class="l">{ready ? `Nível de preparação · ${level.faixa}` : 'Sem classificação definitiva'}</div>
        </div>
        <div class="kpi-cell">
          <div class="n">{confidence.nivel}</div>
          <div class="l">Evidência do índice · {Math.round(confidence.value * 100)}%</div>
        </div>
        <div class="kpi-cell">
          <div class="n">{m.retencao.available ? `${Math.round(m.retencao.raw)}%` : '—'}</div>
          <div class="l">Retenção média</div>
        </div>
      </div>

      <section class="readiness-projection-summary" aria-label="Resumo da projeção">
        <h3 class="analytical-title">Projeção atual</h3>
        <p class="analytical-result">
          {projection.available ? `Faixa atual: ${projection.low}–${projection.high}%` : 'Dados insuficientes'}
        </p>
        <p class="supporting-text">
          {projection.available
            ? `Confiança da projeção: ${String(projection.calibration.confidenceLabel).toLowerCase()} · ${projection.evidence.observationCount} simulados comparáveis · ${projection.evidence.sampleSize} questões na amostra.`
            : 'Ainda não há evidências comparáveis suficientes para estimar uma faixa atual. Continue registrando seus resultados.'}{' '}
          A faixa não representa chance de aprovação.
        </p>
        <Raw
          html={renderActionGroup({
            label: 'Investigar a projeção',
            actions: [{ label: 'Ver trajetória em Desempenho', attributes: { 'data-performance-jump': 'overview' } }],
          })}
        />
      </section>

      <details class="readiness-explanation editorial-disclosure">
        <summary>Como este índice foi calculado?</summary>
        <div>
          {factors.map(([label, item]) => (
            <FactorBar
              key={label}
              label={label}
              item={item}
              dataState={getMetricDataState(item)}
              stateLabel={metricStateLabel(item)}
            />
          ))}
          <p>
            Fatores do cálculo de hoje; os valores dos fechamentos ficam em “Por que a Prontidão mudou?”. Os
            pesos são redistribuídos somente entre fatores com dados. Fatores ausentes reduzem a evidência do
            índice e nunca recebem nota zero.
          </p>
          <ul>
            {factors.map(([label, item]) => (
              <li key={label}>
                <strong>{label}</strong>:{' '}
                {item.available
                  ? `${item.score}/100 · evidência do fator ${Math.round(item.confidence * 100)}%`
                  : 'aguardando dados'}
                {item.detail ? ` · ${item.detail}` : ''}
              </li>
            ))}
          </ul>
          <Raw
            html={renderActionGroup({
              label: 'Ajuda sobre Prontidão',
              contentHTML: renderContextualHelp('readiness', 'Entenda o Índice de Prontidão'),
            })}
          />
        </div>
      </details>

      <details class="readiness-investigation editorial-disclosure">
        <summary>Investigar a faixa e o diagnóstico</summary>
        <div>
          {projection.available ? (
            <section class="performance-forecast" aria-label="Projeção de desempenho">
              <div>
                <small>{projectionGapText(projection)}</small>
              </div>
              <div>
                <strong>
                  {projection.forecast30.available
                    ? `Em 30 dias: ${projection.forecast30.low}–${projection.forecast30.high}%`
                    : 'Projeção de 30 dias aguardando dados'}
                </strong>
                <small>{forecastText(projection)}</small>
              </div>
              <Raw html={renderScoreProjectionEvidence(projection.calibration, candidates)} />
              <Raw html={renderProjectionCalibration(projectionHistory)} />
              <p>
                {projection.evidence.observationCount} simulados comparáveis · {projection.evidence.sampleSize}{' '}
                questões na amostra. Extrapolação de tendência não representa garantia nem efeito causal.
              </p>
            </section>
          ) : (
            <Raw html={renderScoreProjectionEvidence(projection.calibration)} />
          )}
          <div class="approval-scale">
            <span class="approval-scale-danger">0–49</span>
            <span class="approval-scale-warn">50–69</span>
            <span class="approval-scale-good">70–84</span>
            <span class="approval-scale-great">85+</span>
          </div>
          <ul class="upcoming-list">
            {diagnostics.map((text, index) => (
              <li key={index}>{text}</li>
            ))}
          </ul>
        </div>
      </details>
    </>
  );
}
