import { SuperAdminDashboard } from '../types/SuperAdminDashboard';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchSuperAdminDashboard(de?: string, ate?: string): Promise<SuperAdminDashboard> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsSuperAdmin<SuperAdminDashboard>(`/super-admin/dashboard${query}`);
}
