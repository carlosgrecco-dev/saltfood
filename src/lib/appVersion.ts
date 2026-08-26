import { apiRequest } from './apiClient';

export interface AppVersionInfo {
  ultimaVersao: string;
  versaoMinima: string;
}

export async function fetchAppVersion(): Promise<AppVersionInfo> {
  return apiRequest<AppVersionInfo>('/app-version');
}
