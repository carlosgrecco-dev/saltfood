import { Favorito } from '../types/Favorito';
import { apiRequestAsCliente } from './clienteSession';

const base = (empresaId: string, clienteId: string) => `/empresas/${empresaId}/clientes/${clienteId}/favoritos`;

export async function fetchFavoritos(empresaId: string, clienteId: string): Promise<Favorito[]> {
  return apiRequestAsCliente<Favorito[]>(empresaId, base(empresaId, clienteId));
}

export async function addFavorito(empresaId: string, clienteId: string, produtoId: string): Promise<Favorito> {
  return apiRequestAsCliente<Favorito>(empresaId, base(empresaId, clienteId), {
    method: 'POST',
    body: JSON.stringify({ produtoId }),
  });
}

export async function removeFavorito(empresaId: string, clienteId: string, produtoId: string): Promise<void> {
  return apiRequestAsCliente<void>(empresaId, `${base(empresaId, clienteId)}/${produtoId}`, { method: 'DELETE' });
}
