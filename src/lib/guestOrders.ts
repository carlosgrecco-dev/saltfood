/** Histórico de pedidos de convidado (sem login) guardado no navegador — permite "Meus Pedidos"
 * mostrar pedidos passados mesmo sem conta, já que o checkout aceita convidado normalmente.
 * Escopado por loja, porque o mesmo navegador pode ser usado em lojas diferentes. */
const STORAGE_PREFIX = 'kifood:guest_pedidos:';
const MAX_GUARDADOS = 20;

const storageKey = (empresaId: string) => `${STORAGE_PREFIX}${empresaId}`;

export function salvarPedidoConvidado(empresaId: string, pedidoId: string): void {
  try {
    const atuais = getPedidoIdsConvidado(empresaId);
    const proximos = [pedidoId, ...atuais.filter((id) => id !== pedidoId)].slice(0, MAX_GUARDADOS);
    localStorage.setItem(storageKey(empresaId), JSON.stringify(proximos));
  } catch {
    /* localStorage indisponível (modo privado, etc.) — sem histórico de convidado, sem quebrar o checkout */
  }
}

export function getPedidoIdsConvidado(empresaId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(empresaId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
