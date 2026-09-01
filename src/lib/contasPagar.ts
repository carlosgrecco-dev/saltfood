import { ContaPagar, ContaPagarInput, StatusConta } from '../types/ContaFinanceira';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchContasPagar(empresaId: string, status?: StatusConta): Promise<ContaPagar[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequestAsAdmin<ContaPagar[]>(empresaId, `/empresas/${empresaId}/contas-pagar${query}`);
}

export async function createContaPagar(empresaId: string, input: ContaPagarInput): Promise<ContaPagar> {
  return apiRequestAsAdmin<ContaPagar>(empresaId, `/empresas/${empresaId}/contas-pagar`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateContaPagar(empresaId: string, id: string, input: Partial<ContaPagarInput & { status: StatusConta }>): Promise<ContaPagar> {
  return apiRequestAsAdmin<ContaPagar>(empresaId, `/empresas/${empresaId}/contas-pagar/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteContaPagar(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/contas-pagar/${id}`, { method: 'DELETE' });
}
