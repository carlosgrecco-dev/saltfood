import { RecursosPlataformaResumo } from '../types/SuperAdminRecursos';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchRecursosPlataforma(): Promise<RecursosPlataformaResumo> {
  return apiRequestAsSuperAdmin<RecursosPlataformaResumo>('/super-admin/recursos-plataforma');
}
