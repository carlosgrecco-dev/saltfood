import { API_URL, ApiError } from './apiClient';
import { getAnyAdminSession } from './adminAuth';

async function uploadComToken(arquivo: File, token: string | undefined): Promise<string> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

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

export async function uploadImagem(arquivo: File): Promise<string> {
  const session = getAnyAdminSession();
  return uploadComToken(arquivo, session?.token);
}

/** Upload de imagem autenticado com um token explícito (cliente na avaliação, motoboy no comprovante de entrega). */
export async function uploadImagemComToken(arquivo: File, token: string): Promise<string> {
  return uploadComToken(arquivo, token);
}
