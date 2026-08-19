import { ConfiguracaoPlataforma, ConfiguracaoPlataformaInput } from '../types/ConfiguracaoPlataforma';
import { apiRequest } from './apiClient';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export interface ConfiguracaoPublica {
  nomeEmpresa: string;
  emailSuporte: string | null;
  telefoneSuporte: string | null;
}

/** Subconjunto público (sem chaves globais) — usado na landing page da plataforma. */
export async function fetchConfiguracaoPublica(): Promise<ConfiguracaoPublica> {
  return apiRequest<ConfiguracaoPublica>('/configuracoes-plataforma/publico');
}

export async function fetchConfiguracaoPlataforma(): Promise<ConfiguracaoPlataforma> {
  return apiRequestAsSuperAdmin<ConfiguracaoPlataforma>('/configuracoes-plataforma');
}

export async function updateConfiguracaoPlataforma(input: Partial<ConfiguracaoPlataformaInput>): Promise<ConfiguracaoPlataforma> {
  return apiRequestAsSuperAdmin<ConfiguracaoPlataforma>('/configuracoes-plataforma', { method: 'PUT', body: JSON.stringify(input) });
}
