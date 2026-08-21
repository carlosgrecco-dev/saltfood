import { SaltfoodCoinsReport } from '../types/SaltfoodCoinsReport';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchSaltfoodCoinsReport(de?: string, ate?: string): Promise<SaltfoodCoinsReport> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsSuperAdmin<SaltfoodCoinsReport>(`/super-admin/saltfood-coins${query}`);
}
