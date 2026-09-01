/** Pré-vendas/orçamentos do PDV — não existe conceito de "orçamento" no backend (só pedidos de
 * verdade), então isso fica salvo localmente no navegador do terminal, sem sincronizar entre
 * dispositivos. Serve pra guardar um carrinho montado sem criar um Pedido de verdade ainda. */

export interface PreVendaItem {
  produtoNome: string;
  quantidade: number;
  opcoesLabel: string;
  precoUnitario: number;
}

export interface PreVenda {
  id: string;
  criadaEm: string;
  clienteNome: string | null;
  observacoes: string;
  itens: PreVendaItem[];
  total: number;
}

const KEY_PREFIX = 'pdv_pre_vendas_';

export function listarPreVendas(empresaId: string): PreVenda[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + empresaId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarPreVenda(empresaId: string, preVenda: Omit<PreVenda, 'id' | 'criadaEm'>): void {
  const atuais = listarPreVendas(empresaId);
  const nova: PreVenda = { ...preVenda, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, criadaEm: new Date().toISOString() };
  localStorage.setItem(KEY_PREFIX + empresaId, JSON.stringify([nova, ...atuais]));
}

export function removerPreVenda(empresaId: string, id: string): void {
  const atuais = listarPreVendas(empresaId).filter((p) => p.id !== id);
  localStorage.setItem(KEY_PREFIX + empresaId, JSON.stringify(atuais));
}
