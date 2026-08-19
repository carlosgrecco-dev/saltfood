import { ZonaEntrega, ZonaEntregaInput } from '../types/ZonaEntrega';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchZonasEntrega(empresaId: string): Promise<ZonaEntrega[]> {
  return apiRequestAsAdmin<ZonaEntrega[]>(empresaId, `/empresas/${empresaId}/zonas-entrega`);
}

export async function createZonaEntrega(empresaId: string, payload: ZonaEntregaInput): Promise<ZonaEntrega> {
  return apiRequestAsAdmin<ZonaEntrega>(empresaId, `/empresas/${empresaId}/zonas-entrega`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateZonaEntrega(empresaId: string, id: string, payload: ZonaEntregaInput): Promise<ZonaEntrega> {
  return apiRequestAsAdmin<ZonaEntrega>(empresaId, `/empresas/${empresaId}/zonas-entrega/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function setZonaEntregaStatus(empresaId: string, id: string, ativo: boolean): Promise<ZonaEntrega> {
  return apiRequestAsAdmin<ZonaEntrega>(empresaId, `/empresas/${empresaId}/zonas-entrega/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ativo }),
  });
}

export async function deleteZonaEntrega(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/zonas-entrega/${id}`, { method: 'DELETE' });
}
