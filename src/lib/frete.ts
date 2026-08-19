import { apiRequest } from './apiClient';

export interface FreteCalculado {
  taxa: number;
  freteGratis: boolean;
  zonaAplicada: { id: string; bairro: string | null } | null;
}

export async function calcularFrete(empresaId: string, bairro: string | undefined, subtotal: number): Promise<FreteCalculado> {
  return apiRequest<FreteCalculado>(`/empresas/${empresaId}/frete/calcular`, {
    method: 'POST',
    body: JSON.stringify({ bairro, subtotal }),
  });
}
