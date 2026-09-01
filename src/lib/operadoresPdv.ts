import { OperadorPdv } from '../types/OperadorPdv';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchOperadoresPdv(empresaId: string, ativo?: boolean): Promise<OperadorPdv[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequestAsAdmin<OperadorPdv[]>(empresaId, `/empresas/${empresaId}/operadores-pdv${query}`);
}

export async function createOperadorPdv(empresaId: string, nome: string): Promise<OperadorPdv> {
  return apiRequestAsAdmin<OperadorPdv>(empresaId, `/empresas/${empresaId}/operadores-pdv`, {
    method: 'POST',
    body: JSON.stringify({ nome }),
  });
}
