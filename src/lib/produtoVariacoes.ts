import { ProdutoVariacao, ProdutoVariacaoInput } from '../types/Produto';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchProdutoVariacoes(empresaId: string, produtoId: string): Promise<ProdutoVariacao[]> {
  return apiRequestAsAdmin<ProdutoVariacao[]>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/variacoes`);
}

export async function createProdutoVariacao(empresaId: string, produtoId: string, payload: ProdutoVariacaoInput): Promise<ProdutoVariacao> {
  return apiRequestAsAdmin<ProdutoVariacao>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/variacoes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProdutoVariacao(empresaId: string, produtoId: string, id: string, payload: ProdutoVariacaoInput): Promise<ProdutoVariacao> {
  return apiRequestAsAdmin<ProdutoVariacao>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/variacoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProdutoVariacao(empresaId: string, produtoId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/variacoes/${id}`, { method: 'DELETE' });
}
