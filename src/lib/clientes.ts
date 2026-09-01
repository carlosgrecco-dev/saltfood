import { Cliente } from '../types/Cliente';
import { FidelidadeAdminResumo } from '../types/Fidelidade';
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

/** Clientes com pedidos/gasto/último pedido/atividade agregados + estatísticas do programa de fidelidade no período (com variação vs período anterior), ranking e atividades recentes. */
export async function fetchClientesFidelidadeResumo(empresaId: string, de?: string, ate?: string): Promise<FidelidadeAdminResumo> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsAdmin<FidelidadeAdminResumo>(empresaId, `/empresas/${empresaId}/clientes/admin-resumo${query}`);
}

/** Zera o progresso de fidelidade (pontos ou carimbos, conforme o método ativo) de TODOS os clientes da loja — ação em lote e irreversível. */
export async function zerarFidelidade(empresaId: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/clientes/fidelidade/zerar`, { method: 'POST' });
}

/** Soma (ou subtrai, com valor negativo) uma quantidade de pontos/carimbos pra TODOS os clientes da loja de uma vez. */
export async function ajustarFidelidadeEmLote(empresaId: string, valor: number): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/clientes/fidelidade/ajustar-em-lote`, {
    method: 'POST',
    body: JSON.stringify({ valor }),
  });
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

/** Credita pontos manualmente no saldo do cliente (bônus avulso, correção, compra por telefone/balcão) — método PONTOS. */
export async function adicionarPontosFidelidade(empresaId: string, clienteId: string, pontos: number): Promise<Cliente> {
  return apiRequestAsAdmin<Cliente>(empresaId, `/empresas/${empresaId}/clientes/${clienteId}/adicionar-pontos`, {
    method: 'POST',
    body: JSON.stringify({ pontos }),
  });
}

/** Vincula o cliente a uma conta SaltFood Coins existente de outra loja — exige a senha de lá pra confirmar. */
export async function vincularContaPlataforma(empresaId: string, clienteId: string, email: string, senha: string): Promise<Cliente> {
  return apiRequestAsCliente<Cliente>(empresaId, `/empresas/${empresaId}/clientes/${clienteId}/vincular-conta-plataforma`, {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}
