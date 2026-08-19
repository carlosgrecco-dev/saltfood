import { HorarioFuncionamento } from '../types/Empresa';
import { apiRequestAsAdmin } from './adminAuth';

export interface HorarioInput {
  diaSemana: number;
  abre: string | null;
  fecha: string | null;
  fechado: boolean;
}

export async function fetchHorarios(empresaId: string): Promise<HorarioFuncionamento[]> {
  return apiRequestAsAdmin<HorarioFuncionamento[]>(empresaId, `/empresas/${empresaId}/horarios`);
}

export async function updateHorarios(empresaId: string, horarios: HorarioInput[]): Promise<HorarioFuncionamento[]> {
  return apiRequestAsAdmin<HorarioFuncionamento[]>(empresaId, `/empresas/${empresaId}/horarios`, {
    method: 'PUT',
    body: JSON.stringify({ horarios }),
  });
}
