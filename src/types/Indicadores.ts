export interface IndicadorDia {
  date: string;
  ticketMedio: number;
  cancelamentosPercent: number;
  tempoMedioEntregaMin: number | null;
  entregasNoPrazoPercent: number | null;
}

export interface IndicadoresResumo {
  serie: IndicadorDia[];
  taxaRecompraPercent: number;
}
