import { RfmSegmento } from './Dashboard';

export type { RfmSegmento };

export const RFM_SEGMENT_BADGE_CLASSES: Record<RfmSegmento, string> = {
  CAMPEOES: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FIEIS: 'bg-blue-100 text-blue-700 border-blue-200',
  POTENCIAIS: 'bg-teal-100 text-teal-700 border-teal-200',
  EM_RISCO: 'bg-amber-100 text-amber-700 border-amber-200',
  PERDIDOS: 'bg-gray-100 text-gray-600 border-gray-200',
};

export interface RfmCliente {
  clienteId: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  recenciaDias: number;
  frequencia: number;
  monetario: number;
  ultimaCompraEm: string | null;
  scoreR: number;
  scoreF: number;
  scoreM: number;
  segmento: RfmSegmento;
}

export interface RfmGrupo {
  segmento: RfmSegmento;
  label: string;
  clientes: RfmCliente[];
}

export interface RfmResumo {
  segmentos: RfmGrupo[];
  totalClientes: number;
}
