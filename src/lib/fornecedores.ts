import { Fornecedor, FornecedorInput } from '../types/Fornecedor';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchFornecedores(empresaId: string, ativo?: boolean): Promise<Fornecedor[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequestAsAdmin<Fornecedor[]>(empresaId, `/empresas/${empresaId}/fornecedores${query}`);
}

export async function createFornecedor(empresaId: string, input: FornecedorInput): Promise<Fornecedor> {
  return apiRequestAsAdmin<Fornecedor>(empresaId, `/empresas/${empresaId}/fornecedores`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateFornecedor(empresaId: string, id: string, input: Partial<FornecedorInput & { ativo: boolean }>): Promise<Fornecedor> {
  return apiRequestAsAdmin<Fornecedor>(empresaId, `/empresas/${empresaId}/fornecedores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteFornecedor(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/fornecedores/${id}`, { method: 'DELETE' });
}
