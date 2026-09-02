import { UsuarioAdmin, UsuarioAdminInput } from '../types/UsuarioAdmin';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchUsuariosAdmin(empresaId: string): Promise<UsuarioAdmin[]> {
  return apiRequestAsAdmin<UsuarioAdmin[]>(empresaId, `/empresas/${empresaId}/usuarios-admin`);
}

export async function createUsuarioAdmin(empresaId: string, input: UsuarioAdminInput): Promise<UsuarioAdmin> {
  return apiRequestAsAdmin<UsuarioAdmin>(empresaId, `/empresas/${empresaId}/usuarios-admin`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateUsuarioAdmin(
  empresaId: string,
  id: string,
  input: Partial<Pick<UsuarioAdminInput, 'nome' | 'papel' | 'senha'> & { ativo: boolean }>
): Promise<UsuarioAdmin> {
  return apiRequestAsAdmin<UsuarioAdmin>(empresaId, `/empresas/${empresaId}/usuarios-admin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteUsuarioAdmin(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/usuarios-admin/${id}`, { method: 'DELETE' });
}
