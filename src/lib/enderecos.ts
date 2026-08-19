import { EnderecoCliente, EnderecoInput } from '../types/Endereco';
import { apiRequestAsCliente } from './clienteSession';

const base = (empresaId: string, clienteId: string) => `/empresas/${empresaId}/clientes/${clienteId}/enderecos`;

export async function fetchEnderecos(empresaId: string, clienteId: string): Promise<EnderecoCliente[]> {
  return apiRequestAsCliente<EnderecoCliente[]>(empresaId, base(empresaId, clienteId));
}

export async function createEndereco(empresaId: string, clienteId: string, input: EnderecoInput): Promise<EnderecoCliente> {
  return apiRequestAsCliente<EnderecoCliente>(empresaId, base(empresaId, clienteId), { method: 'POST', body: JSON.stringify(input) });
}

export async function updateEndereco(empresaId: string, clienteId: string, id: string, input: EnderecoInput): Promise<EnderecoCliente> {
  return apiRequestAsCliente<EnderecoCliente>(empresaId, `${base(empresaId, clienteId)}/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function setEnderecoPrincipal(empresaId: string, clienteId: string, id: string): Promise<EnderecoCliente> {
  return apiRequestAsCliente<EnderecoCliente>(empresaId, `${base(empresaId, clienteId)}/${id}/principal`, { method: 'PATCH' });
}

export async function deleteEndereco(empresaId: string, clienteId: string, id: string): Promise<void> {
  return apiRequestAsCliente<void>(empresaId, `${base(empresaId, clienteId)}/${id}`, { method: 'DELETE' });
}
