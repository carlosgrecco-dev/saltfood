import { ContaReceber, ContaReceberInput, StatusConta } from '../types/ContaFinanceira';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchContasReceber(empresaId: string, status?: StatusConta): Promise<ContaReceber[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequestAsAdmin<ContaReceber[]>(empresaId, `/empresas/${empresaId}/contas-receber${query}`);
}

export async function createContaReceber(empresaId: string, input: ContaReceberInput): Promise<ContaReceber> {
  return apiRequestAsAdmin<ContaReceber>(empresaId, `/empresas/${empresaId}/contas-receber`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateContaReceber(empresaId: string, id: string, input: Partial<ContaReceberInput & { status: StatusConta }>): Promise<ContaReceber> {
  return apiRequestAsAdmin<ContaReceber>(empresaId, `/empresas/${empresaId}/contas-receber/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteContaReceber(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/contas-receber/${id}`, { method: 'DELETE' });
}
