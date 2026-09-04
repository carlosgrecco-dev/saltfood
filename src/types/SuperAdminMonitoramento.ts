export interface MonitoramentoResumo {
  banco: { ok: boolean; erro: string | null };
  errosUltimas24h: number;
  gateways: { total: number; ativos: number };
}
