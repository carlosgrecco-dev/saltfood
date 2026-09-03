import { SuperAdminNotificacoesResumo } from '../types/SuperAdminNotificacao';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchSuperAdminNotificacoes(): Promise<SuperAdminNotificacoesResumo> {
  return apiRequestAsSuperAdmin<SuperAdminNotificacoesResumo>('/super-admin/notificacoes');
}
