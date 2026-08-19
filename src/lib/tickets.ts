import { TicketSuporte, TicketInput, StatusTicketSuporte } from '../types/Ticket';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsCliente } from './clienteSession';

const base = (empresaId: string) => `/empresas/${empresaId}/tickets`;

export async function fetchMeusTickets(empresaId: string): Promise<TicketSuporte[]> {
  return apiRequestAsCliente<TicketSuporte[]>(empresaId, base(empresaId));
}

export async function createTicket(empresaId: string, payload: TicketInput): Promise<TicketSuporte> {
  return apiRequestAsCliente<TicketSuporte>(empresaId, base(empresaId), { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchTicketsAsAdmin(empresaId: string): Promise<TicketSuporte[]> {
  return apiRequestAsAdmin<TicketSuporte[]>(empresaId, base(empresaId));
}

export async function updateTicket(empresaId: string, id: string, payload: { status?: StatusTicketSuporte; respostaAdmin?: string }): Promise<TicketSuporte> {
  return apiRequestAsAdmin<TicketSuporte>(empresaId, `${base(empresaId)}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
