import { Categoria, CategoriaInput } from '../types/Produto';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchCategorias(empresaId: string): Promise<Categoria[]> {
  return apiRequest<Categoria[]>(`/empresas/${empresaId}/categorias`);
}

export async function createCategoria(empresaId: string, payload: CategoriaInput): Promise<Categoria> {
  return apiRequestAsAdmin<Categoria>(empresaId, `/empresas/${empresaId}/categorias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategoria(empresaId: string, id: string, payload: CategoriaInput): Promise<Categoria> {
  return apiRequestAsAdmin<Categoria>(empresaId, `/empresas/${empresaId}/categorias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategoria(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/categorias/${id}`, { method: 'DELETE' });
}
