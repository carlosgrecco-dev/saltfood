export interface BackupInfo {
  nomeArquivo: string;
  tamanho: number;
  criadoEm: string;
}

export interface MonitoramentoResumo {
  banco: { ok: boolean; erro: string | null };
  errosUltimas24h: number;
  gateways: { total: number; ativos: number };
  backups: { total: number; ultimo: BackupInfo | null; lista: BackupInfo[] };
}

export interface BackupGerado extends BackupInfo {
  totalTabelas: number;
}
