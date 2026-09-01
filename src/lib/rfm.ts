import { RfmResumo } from '../types/Rfm';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchRfm(empresaId: string): Promise<RfmResumo> {
  return apiRequestAsAdmin<RfmResumo>(empresaId, `/empresas/${empresaId}/clientes/rfm`);
}
