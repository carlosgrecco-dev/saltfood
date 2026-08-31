import { TicketSuporte, TicketInput, TicketLojistaInput, StatusTicketSuporte } from '../types/Ticket';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsCliente } from './clienteSession';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

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

/** Lojista abre um chamado direto com a Sigma/plataforma (não é um ticket de cliente). */
export async function abrirChamadoLojista(empresaId: string, payload: TicketLojistaInput): Promise<TicketSuporte> {
  return apiRequestAsAdmin<TicketSuporte>(empresaId, `${base(empresaId)}/lojista`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchChamadosLojistas(): Promise<TicketSuporte[]> {
  return apiRequestAsSuperAdmin<TicketSuporte[]>('/super-admin/chamados-lojistas');
}

export async function updateChamadoLojista(id: string, payload: { status?: StatusTicketSuporte; respostaAdmin?: string }): Promise<TicketSuporte> {
  return apiRequestAsSuperAdmin<TicketSuporte>(`/super-admin/chamados-lojistas/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
