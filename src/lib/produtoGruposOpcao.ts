import { ProdutoGrupoOpcao, ProdutoGrupoOpcaoInput, ProdutoOpcao, ProdutoOpcaoInput } from '../types/Produto';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchProdutoGruposOpcao(empresaId: string, produtoId: string): Promise<ProdutoGrupoOpcao[]> {
  return apiRequestAsAdmin<ProdutoGrupoOpcao[]>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/grupos-opcao`);
}

export async function createProdutoGrupoOpcao(empresaId: string, produtoId: string, payload: ProdutoGrupoOpcaoInput): Promise<ProdutoGrupoOpcao> {
  return apiRequestAsAdmin<ProdutoGrupoOpcao>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/grupos-opcao`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProdutoGrupoOpcao(empresaId: string, produtoId: string, id: string, payload: ProdutoGrupoOpcaoInput): Promise<ProdutoGrupoOpcao> {
  return apiRequestAsAdmin<ProdutoGrupoOpcao>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/grupos-opcao/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProdutoGrupoOpcao(empresaId: string, produtoId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/grupos-opcao/${id}`, { method: 'DELETE' });
}

export async function createProdutoOpcao(empresaId: string, produtoId: string, grupoId: string, payload: ProdutoOpcaoInput): Promise<ProdutoOpcao> {
  return apiRequestAsAdmin<ProdutoOpcao>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/grupos-opcao/${grupoId}/opcoes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProdutoOpcao(empresaId: string, produtoId: string, grupoId: string, id: string, payload: ProdutoOpcaoInput): Promise<ProdutoOpcao> {
  return apiRequestAsAdmin<ProdutoOpcao>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/grupos-opcao/${grupoId}/opcoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProdutoOpcao(empresaId: string, produtoId: string, grupoId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/produtos/${produtoId}/grupos-opcao/${grupoId}/opcoes/${id}`, { method: 'DELETE' });
}
