export type TipoZonaEntrega = 'BAIRRO' | 'RAIO_KM' | 'FAIXA_DISTANCIA';

export const TIPO_ZONA_LABELS: Record<TipoZonaEntrega, string> = {
  BAIRRO: 'Por bairro',
  RAIO_KM: 'Por raio (km)',
  FAIXA_DISTANCIA: 'Por faixa de distância',
};

export interface ZonaEntrega {
  id: string;
  empresaId: string;
  tipo: TipoZonaEntrega;
  bairro: string | null;
  distanciaDeKm: number | null;
  distanciaAteKm: number | null;
  taxa: number;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZonaEntregaInput {
  tipo: TipoZonaEntrega;
  bairro?: string | null;
  distanciaDeKm?: number | null;
  distanciaAteKm?: number | null;
  taxa: number;
}
