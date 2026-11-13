import type { JSX } from 'preact';

export interface QuickStatsData {
  total: number;
  naoIniciado: number;
  andamento?: number;
  revisao?: number;
  concluido?: number;
  desconhecido?: number;
}

export function QuickStatsGrid({ total, naoIniciado, andamento, revisao, concluido, desconhecido }: QuickStatsData): JSX.Element {
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
      {andamento !== undefined && <div class="stat-cell"><div class="n">{andamento}</div><div class="l">Em andamento</div></div>}
      {revisao !== undefined && <div class="stat-cell"><div class="n">{revisao}</div><div class="l">Em revisão</div></div>}
      {concluido !== undefined && <div class="stat-cell"><div class="n">{concluido}</div><div class="l">Concluídos</div></div>}
      {Boolean(desconhecido) && <div class="stat-cell"><div class="n">{desconhecido}</div><div class="l">Status não identificado</div></div>}
    </>
  );
}
