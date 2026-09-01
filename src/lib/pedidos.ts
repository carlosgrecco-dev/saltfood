import { Pedido, PedidoInput, StatusPedido, TipoPedido } from '../types/Pedido';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsCliente, getClienteSession } from './clienteSession';
import { apiRequestAsMotoboy, getMotoboySession } from './motoboySession';

export interface PedidoFiltro {
  status?: StatusPedido;
  tipoPedido?: TipoPedido;
  motoboyId?: string;
  clienteId?: string;
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
  if (filtro.tipoPedido) params.set('tipoPedido', filtro.tipoPedido);
  if (filtro.motoboyId) params.set('motoboyId', filtro.motoboyId);
  if (filtro.clienteId) params.set('clienteId', filtro.clienteId);
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

/** Pedido manual criado pelo admin (balcão/mesa/retirada/delivery) — usa o token do admin, não do cliente. */
export async function createPedidoComoAdmin(empresaId: string, input: PedidoInput): Promise<Pedido> {
  return apiRequestAsAdmin<Pedido>(empresaId, `/empresas/${empresaId}/pedidos`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface PedidoEditInput {
  clienteNome?: string;
  clienteTelefone?: string;
  endereco?: string;
  bairro?: string;
  referencia?: string;
  observacoes?: string;
  formaPagamento?: string;
  trocoPara?: number | null;
}

/** Edita dados gerais de um pedido ainda não finalizado — não mexe em itens/valores. */
export async function updatePedido(empresaId: string, id: string, payload: PedidoEditInput): Promise<Pedido> {
  return apiRequestAsAdmin<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Adiciona itens a um pedido ainda não finalizado (mesma regra de negócio do PDV). */
export async function addItensPedido(
  empresaId: string,
  id: string,
  itens: { produtoId: string; quantidade: number; observacoes?: string; opcoes?: string[] }[]
): Promise<Pedido> {
  return apiRequestAsAdmin<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${id}/itens`, {
    method: 'POST',
    body: JSON.stringify({ itens }),
  });
}

/** Remove um item de um pedido ainda não finalizado. */
export async function removeItemPedido(empresaId: string, id: string, itemId: string): Promise<Pedido> {
  return apiRequestAsAdmin<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${id}/itens/${itemId}`, { method: 'DELETE' });
}

export async function updatePedidoStatus(
  empresaId: string,
  id: string,
  status: StatusPedido,
  fotoEntrega?: string,
  pagamentoRecebido?: boolean,
  valorRecebido?: number,
): Promise<Pedido> {
  return apiRequestAsAdminOuMotoboy<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      ...(fotoEntrega ? { fotoEntrega } : {}),
      ...(pagamentoRecebido !== undefined ? { pagamentoRecebido } : {}),
      ...(valorRecebido !== undefined ? { valorRecebido } : {}),
    }),
  });
}

export interface ConferenciaMotoboy {
  motoboyId: string;
  motoboyNome: string;
  entregas: number;
  totais: { PIX: number; DINHEIRO: number; CARTAO: number };
  total: number;
}

export interface ConferenciaMotoboys {
  motoboys: ConferenciaMotoboy[];
  naoConfirmados: number;
}

export async function fetchConferenciaMotoboys(empresaId: string, de?: string, ate?: string): Promise<ConferenciaMotoboys> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsAdmin<ConferenciaMotoboys>(empresaId, `/empresas/${empresaId}/pedidos/conferencia-motoboys${query}`);
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

export interface AvaliarPedidoOpts {
  comentario?: string;
  fotos?: string[];
  notaComida?: number;
  notaEmbalagem?: number;
  notaTempo?: number;
}

export async function avaliarPedido(
  empresaId: string,
  pedidoId: string,
  nota: number,
  opts: AvaliarPedidoOpts = {}
): Promise<Pedido> {
  const { comentario, fotos, notaComida, notaEmbalagem, notaTempo } = opts;
  return apiRequestAsCliente<Pedido>(empresaId, `/empresas/${empresaId}/pedidos/${pedidoId}/avaliar-pedido`, {
    method: 'POST',
    body: JSON.stringify({
      nota,
      comentario,
      ...(fotos && fotos.length ? { fotos } : {}),
      ...(notaComida !== undefined ? { notaComida } : {}),
      ...(notaEmbalagem !== undefined ? { notaEmbalagem } : {}),
      ...(notaTempo !== undefined ? { notaTempo } : {}),
    }),
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
