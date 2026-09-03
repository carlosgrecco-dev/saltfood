import { MonitoramentoResumo, BackupGerado } from '../types/SuperAdminMonitoramento';
import { apiRequestAsSuperAdmin, getSuperAdminSession } from './superAdminAuth';
import { API_URL, ApiError } from './apiClient';

export async function fetchMonitoramento(): Promise<MonitoramentoResumo> {
  return apiRequestAsSuperAdmin<MonitoramentoResumo>('/super-admin/monitoramento');
}

export async function gerarBackupAgora(): Promise<BackupGerado> {
  return apiRequestAsSuperAdmin<BackupGerado>('/super-admin/backups', { method: 'POST' });
}

/** Baixa um backup direto no navegador (a rota exige o header Authorization, por isso não dá pra usar um <a href> simples). */
export async function baixarBackup(nomeArquivo: string): Promise<void> {
  const session = getSuperAdminSession();
  const res = await fetch(`${API_URL}/super-admin/backups/${encodeURIComponent(nomeArquivo)}`, {
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
  });
  if (!res.ok) {
    throw new ApiError(`Erro ao baixar backup (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
