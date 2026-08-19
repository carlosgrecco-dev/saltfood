import { Produto } from '../types/Produto';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';

export interface ProdutoPayload {
  nome: string;
  descricao?: string | null;
  categoriaId?: string | null;
  preco: number;
  precoPromocional?: number | null;
  fotoUrl?: string | null;
  ativo?: boolean;
  ordem?: number;
  controlarEstoque?: boolean;
  estoqueQtd?: number | null;
  ehCombo?: boolean;
}

export async function fetchProdutos(empresaId: string, ativo?: boolean): Promise<Produto[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequest<Produto[]>(`/empresas/${empresaId}/produtos${query}`);
}

export async function createProduto(empresaId: string, payload: ProdutoPayload): Promise<Produto> {
  return apiRequestAsAdmin<Produto>(empresaId, `/empresas/${empresaId}/produtos`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduto(empresaId: string, id: string, payload: ProdutoPayload): Promise<Produto> {
  return apiRequestAsAdmin<Produto>(empresaId, `/empresas/${empresaId}/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function setProdutoStatus(empresaId: string, id: string, ativo: boolean): Promise<Produto> {
  return apiRequestAsAdmin<Produto>(empresaId, `/empresas/${empresaId}/produtos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ativo }),
  });
}

export async function deleteProduto(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/produtos/${id}`, { method: 'DELETE' });
}

/** Pausa/retoma rapidamente o produto ("Esgotado hoje") sem desativá-lo. */
export async function setProdutoEsgotado(empresaId: string, id: string, esgotadoHoje: boolean): Promise<Produto> {
  return apiRequestAsAdmin<Produto>(empresaId, `/empresas/${empresaId}/produtos/${id}/esgotado`, {
    method: 'PATCH',
    body: JSON.stringify({ esgotadoHoje }),
  });
}
