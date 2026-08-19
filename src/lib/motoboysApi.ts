import { Motoboy } from '../types/Motoboy';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsMotoboy } from './motoboySession';

export interface MotoboyPayload {
  nome: string;
  telefone?: string;
  taxaPadrao?: number;
  ativo?: boolean;
}

export async function fetchMotoboys(empresaId: string, ativo?: boolean): Promise<Motoboy[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequestAsAdmin<Motoboy[]>(empresaId, `/empresas/${empresaId}/motoboys${query}`);
}

export async function createMotoboy(empresaId: string, payload: MotoboyPayload): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateMotoboy(empresaId: string, id: string, payload: MotoboyPayload): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function setMotoboyStatus(empresaId: string, id: string, ativo: boolean): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ativo }),
  });
}

export async function setMotoboyPin(empresaId: string, id: string, pin: string): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}/pin`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

export async function deleteMotoboy(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/motoboys/${id}`, { method: 'DELETE' });
}

export async function loginMotoboy(empresaId: string, telefone: string, pin: string): Promise<{ id: string; nome: string; token: string }> {
  return apiRequest<{ id: string; nome: string; token: string }>(`/empresas/${empresaId}/motoboys/login`, {
    method: 'POST',
    body: JSON.stringify({ telefone, pin }),
  });
}

/** Compartilha a posição GPS atual do motoboy (gratuito, via navigator.geolocation do navegador). */
export async function updateMotoboyLocalizacao(empresaId: string, id: string, latitude: number, longitude: number): Promise<Motoboy> {
  return apiRequestAsMotoboy<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}/localizacao`, {
    method: 'PATCH',
    body: JSON.stringify({ latitude, longitude }),
  });
}
