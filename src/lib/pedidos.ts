import { Pedido, PedidoInput, StatusPedido } from '../types/Pedido';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsCliente, getClienteSession } from './clienteSession';
import { apiRequestAsMotoboy, getMotoboySession } from './motoboySession';

export interface PedidoFiltro {
  status?: StatusPedido;
  motoboyId?: string;
  motoboyPago?: boolean;
  de?: string;
  ate?: string;
}

/**
 * GET / e PATCH /:id/status são usados tanto pelo admin (qualquer pedido/status) quanto pelo
 * portal do motoboy (só a própria corrida, só pra confirmar ENTREGUE) — usa a sessão de motoboy
 * quando ela existir nesta empresa, senão cai pra sessão de admin.
 */
function apiRequestAsAdminOuMotoboy<T>(empresaId: string, path: string, init?: RequestInit): Promise<T> {
  if (getMotoboySession(empresaId)) {
    return apiRequestAsMotoboy<T>(empresaId, path, init);
  }
  return apiRequestAsAdmin<T>(empresaId, path, init);
}

export async function fetchPedidos(empresaId: string, filtro: PedidoFiltro = {}): Promise<Pedido[]> {
  const params = new URLSearchParams();
  if (filtro.status) params.set('status', filtro.status);
  if (filtro.motoboyId) params.set('motoboyId', filtro.motoboyId);
  if (filtro.motoboyPago !== undefined) params.set('motoboyPago', String(filtro.motoboyPago));
  if (filtro.de) params.set('de', filtro.de);
  if (filtro.ate) params.set('ate', filtro.ate);
  const query = params.toString() ? `?${params.toString()}` : '';

  return apiRequestAsAdminOuMotoboy<Pedido[]>(empresaId, `/empresas/${empresaId}/pedidos${query}`);
}

/** Link de acompanhamento do pedido — público (protegido só pelo UUID ser difícil de adivinhar). */
export async function fetchPedidoById(empresaId: string, id: string): Promise<Pedido> {
  return apiRequest<Pedido>(`/empresas/${empresaId}/pedidos/${id}`);
}

/** Checkout aceita convidado — envia o token do cliente quando ele estiver logado, mas funciona sem. */
export async function createPedido(empresaId: string, input: PedidoInput): Promise<Pedido> {
  const session = getClienteSession(empresaId);
  return apiRequest<Pedido>(`/empresas/${empresaId}/pedidos`, {
    method: 'POST',
    body: JSON.stringify(input),
  }, session?.token);
}

export async function updatePedidoStatus(empresaId: string, id: string, status: StatusPedido): Promise<Pedido> {
  return apiRequestAsAdminOuMotoboy<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function assignMotoboy(empresaId: string, id: string, motoboyId: string | null): Promise<Pedido> {
  return apiRequestAsAdmin<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${id}/motoboy`, {
    method: 'PATCH',
    body: JSON.stringify({ motoboyId }),
  });
}

/** Aplica o item grátis da fidelidade a um pedido já criado, quando o cliente pede depois (WhatsApp, telefone etc.). */
export async function liberarResgateFidelidade(empresaId: string, id: string): Promise<Pedido> {
  return apiRequestAsAdmin<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${id}/liberar-resgate`, {
    method: 'POST',
  });
}

export interface PagamentoMotoboyResultado {
  movimento: { id: string; valor: number };
  corridas: number;
  total: number;
}

export async function pagarMotoboy(empresaId: string, motoboyId: string): Promise<PagamentoMotoboyResultado> {
  return apiRequestAsAdmin<PagamentoMotoboyResultado>(empresaId, `/empresas/${empresaId}/pedidos/pagar-motoboy`, {
    method: 'POST',
    body: JSON.stringify({ motoboyId }),
  });
}

export async function avaliarPedido(
  empresaId: string,
  pedidoId: string,
  nota: number,
  comentario?: string
): Promise<Pedido> {
  return apiRequestAsCliente<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${pedidoId}/avaliar-pedido`, {
    method: 'POST',
    body: JSON.stringify({ nota, comentario }),
  });
}

export async function avaliarMotoboy(
  empresaId: string,
  pedidoId: string,
  nota: number,
  comentario?: string
): Promise<Pedido> {
  return apiRequestAsCliente<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${pedidoId}/avaliar-motoboy`, {
    method: 'POST',
    body: JSON.stringify({ nota, comentario }),
  });
}
