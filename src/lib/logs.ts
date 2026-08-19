import { GatewayStatus, LogAuditoria, TipoLog } from '../types/Log';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchLogs(filtro: { tipo?: TipoLog; empresaId?: string; de?: string; ate?: string } = {}): Promise<LogAuditoria[]> {
  const params = new URLSearchParams();
  if (filtro.tipo) params.set('tipo', filtro.tipo);
  if (filtro.empresaId) params.set('empresaId', filtro.empresaId);
  if (filtro.de) params.set('de', filtro.de);
  if (filtro.ate) params.set('ate', filtro.ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsSuperAdmin<LogAuditoria[]>(`/logs${query}`);
}

export async function fetchGatewaysStatus(): Promise<GatewayStatus[]> {
  return apiRequestAsSuperAdmin<GatewayStatus[]>('/logs/gateways-status');
}
