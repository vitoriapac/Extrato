import type { JSX } from 'preact';

// Em andamento e concluídos já aparecem no cabeçalho do extrato.
export interface QuickStatsData {
  total: number;
  naoIniciado: number;
}

export function QuickStatsGrid({ total, naoIniciado }: QuickStatsData): JSX.Element {
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
    </>
  );
}
