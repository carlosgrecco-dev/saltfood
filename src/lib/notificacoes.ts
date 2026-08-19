import { NotificacaoCliente } from '../types/Notificacao';
import { apiRequestAsCliente } from './clienteSession';

const base = (empresaId: string, clienteId: string) => `/empresas/${empresaId}/clientes/${clienteId}/notificacoes`;

export async function fetchNotificacoes(empresaId: string, clienteId: string): Promise<NotificacaoCliente[]> {
  return apiRequestAsCliente<NotificacaoCliente[]>(empresaId, base(empresaId, clienteId));
}

export async function marcarNotificacaoLida(empresaId: string, clienteId: string, id: string): Promise<NotificacaoCliente> {
  return apiRequestAsCliente<NotificacaoCliente>(empresaId, `${base(empresaId, clienteId)}/${id}/lida`, { method: 'PATCH' });
}

export async function marcarTodasNotificacoesLidas(empresaId: string, clienteId: string): Promise<void> {
  return apiRequestAsCliente<void>(empresaId, `${base(empresaId, clienteId)}/marcar-todas-lidas`, { method: 'PATCH' });
}
