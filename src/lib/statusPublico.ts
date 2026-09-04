import { apiRequest } from './apiClient';

export interface StatusPublico {
  operacional: boolean;
  verificadoEm: string;
}

export async function fetchStatusPublico(): Promise<StatusPublico> {
  return apiRequest<StatusPublico>('/status-publico');
}
