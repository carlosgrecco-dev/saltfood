import { MonitoramentoResumo } from '../types/SuperAdminMonitoramento';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchMonitoramento(): Promise<MonitoramentoResumo> {
  return apiRequestAsSuperAdmin<MonitoramentoResumo>('/super-admin/monitoramento');
}
