import type { JSX } from 'preact';

export interface QuickStatsData {
  total: number;
  naoIniciado: number;
  emAndamento: number;
  concluido: number;
}

export function QuickStatsGrid({
  total,
  naoIniciado,
  emAndamento,
  concluido,
}: QuickStatsData): JSX.Element {
  return (
    <>
      <div class="stat-cell">
        <div class="n">{total}</div>
        <div class="l">Tópicos totais</div>
      </div>
      <div class="stat-cell">
        <div class="n">{naoIniciado}</div>
        <div class="l">Não iniciados</div>
      </div>
      <div class="stat-cell">
        <div class="n">{emAndamento}</div>
        <div class="l">Em andamento</div>
      </div>
      <div class="stat-cell">
        <div class="n">{concluido}</div>
        <div class="l">Concluídos</div>
      </div>
    </>
  );
}
