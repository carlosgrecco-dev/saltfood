import { API_URL, ApiError } from './apiClient';
import { getAnyAdminSession } from './adminAuth';

export async function uploadImagem(arquivo: File): Promise<string> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  const session = getAnyAdminSession();
  const headers: Record<string, string> = {};
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Erro ao enviar imagem (${res.status})`, res.status);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
