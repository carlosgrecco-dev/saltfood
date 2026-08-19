import { API_URL } from './apiClient';

export const suportaPush = (): boolean =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** VAPID exige a chave pública em Uint8Array, não na string base64url que a API devolve. */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/** Pede permissão, inscreve o navegador no push e registra a inscrição pra este pedido específico. */
export async function ativarNotificacoesPedido(empresaId: string, pedidoId: string): Promise<void> {
  if (!suportaPush()) {
    throw new Error('Seu navegador não suporta notificações push.');
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') {
    throw new Error('Permissão de notificação negada.');
  }

  const { publicKey } = await fetch(`${API_URL}/empresas/${empresaId}/push/vapid-public-key`).then((r) => r.json());
  if (!publicKey) {
    throw new Error('Notificações push não estão disponíveis nesta loja no momento.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  const res = await fetch(`${API_URL}/empresas/${empresaId}/push/pedidos/${pedidoId}/inscrever`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!res.ok) {
    throw new Error('Não foi possível registrar as notificações para este pedido.');
  }
}
