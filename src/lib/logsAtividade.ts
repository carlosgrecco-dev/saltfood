import { LogAtividadeLoja } from '../types/LogAtividade';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchLogsAtividade(empresaId: string, limite = 100): Promise<LogAtividadeLoja[]> {
  return apiRequestAsAdmin<LogAtividadeLoja[]>(empresaId, `/empresas/${empresaId}/logs-atividade?limite=${limite}`);
}
