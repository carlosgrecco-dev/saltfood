import { HeroSlide, HeroSlideInput } from '../types/HeroSlide';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchHeroSlides(empresaId: string, ativo?: boolean): Promise<HeroSlide[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequest<HeroSlide[]>(`/empresas/${empresaId}/hero-slides${query}`);
}

export async function createHeroSlide(empresaId: string, payload: HeroSlideInput): Promise<HeroSlide> {
  return apiRequestAsAdmin<HeroSlide>(empresaId, `/empresas/${empresaId}/hero-slides`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHeroSlide(empresaId: string, id: string, payload: HeroSlideInput): Promise<HeroSlide> {
  return apiRequestAsAdmin<HeroSlide>(empresaId, `/empresas/${empresaId}/hero-slides/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function setHeroSlideStatus(empresaId: string, id: string, ativo: boolean): Promise<HeroSlide> {
  return apiRequestAsAdmin<HeroSlide>(empresaId, `/empresas/${empresaId}/hero-slides/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ativo }),
  });
}

export async function deleteHeroSlide(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/hero-slides/${id}`, { method: 'DELETE' });
}
