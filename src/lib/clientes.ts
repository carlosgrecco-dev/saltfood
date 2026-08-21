import { Cliente } from '../types/Cliente';
import { Pedido } from '../types/Pedido';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsCliente } from './clienteSession';

export interface SignUpPayload {
  nome: string;
  telefone?: string;
  email: string;
  senha: string;
  /** Código de indicação de outro cliente (opcional) — inválido/inexistente é ignorado silenciosamente pelo backend. */
  indicadoPor?: string;
}

export type ClienteAuth = Cliente & { token: string };

export async function signUpCliente(empresaId: string, payload: SignUpPayload): Promise<ClienteAuth> {
  return apiRequest<ClienteAuth>(`/empresas/${empresaId}/clientes/signup`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginCliente(empresaId: string, email: string, senha: string): Promise<ClienteAuth> {
  return apiRequest<ClienteAuth>(`/empresas/${empresaId}/clientes/login`, {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export async function fetchClientePerfil(empresaId: string, clienteId: string): Promise<Cliente> {
  return apiRequestAsCliente<Cliente>(empresaId, `/empresas/${empresaId}/clientes/${clienteId}`);
}

export async function fetchMeusPedidos(empresaId: string, clienteId: string): Promise<Pedido[]> {
  return apiRequestAsCliente<Pedido[]>(empresaId, `/empresas/${empresaId}/clientes/${clienteId}/pedidos`);
}

/** Lista todos os clientes cadastrados na loja, usado na aba "Clientes" do admin de Fidelidade. */
export async function fetchClientes(empresaId: string): Promise<Cliente[]> {
  return apiRequestAsAdmin<Cliente[]>(empresaId, `/empresas/${empresaId}/clientes`);
}

/** Marca 1 item grátis do cliente como resgatado (retirada balcão/telefone, sem pedido online). */
export async function liberarResgateCliente(empresaId: string, clienteId: string): Promise<Cliente> {
  return apiRequestAsAdmin<Cliente>(empresaId, `/empresas/${empresaId}/clientes/${clienteId}/liberar-resgate`, { method: 'POST' });
}

/** Credita unidades manualmente no cartão fidelidade (compra por telefone/balcão, fora do pedido online). */
export async function adicionarUnidadesFidelidade(empresaId: string, clienteId: string, unidades: number): Promise<Cliente> {
  return apiRequestAsAdmin<Cliente>(empresaId, `/empresas/${empresaId}/clientes/${clienteId}/adicionar-unidades`, {
    method: 'POST',
    body: JSON.stringify({ unidades }),
  });
}

/** Vincula o cliente a uma conta SaltFood Coins existente de outra loja — exige a senha de lá pra confirmar. */
export async function vincularContaPlataforma(empresaId: string, clienteId: string, email: string, senha: string): Promise<Cliente> {
  return apiRequestAsCliente<Cliente>(empresaId, `/empresas/${empresaId}/clientes/${clienteId}/vincular-conta-plataforma`, {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}
