import React, { useEffect, useMemo, useState } from 'react';
import { ImageOff, RotateCcw } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';
import { fetchMeusPedidos } from '../lib/clientes';
import { fetchProdutos } from '../lib/produtos';
import { Produto } from '../types/Produto';

interface PedirDeNovoStripProps {
  onProductClick: (product: Produto) => void;
}

const TOP_N = 6;

/** "Peça de novo" — os produtos que o cliente mais comprou, cruzados com o cardápio atual (preço/disponibilidade em dia). */
const PedirDeNovoStrip: React.FC<PedirDeNovoStripProps> = ({ onProductClick }) => {
  const { customer } = useCustomer();
  const { empresa } = useTenant();
  const [maisComprados, setMaisComprados] = useState<Produto[]>([]);

  useEffect(() => {
    if (!customer || !empresa.habilitarPedirDeNovo) {
      setMaisComprados([]);
      return;
    }
    let cancelled = false;
    Promise.all([fetchMeusPedidos(empresa.id, customer.id), fetchProdutos(empresa.id, true)])
      .then(([pedidos, produtos]) => {
        if (cancelled) return;
        const contagem = new Map<string, number>();
        for (const pedido of pedidos) {
          if (pedido.status !== 'ENTREGUE') continue;
          for (const item of pedido.itens) {
            if (!item.produtoId) continue;
            contagem.set(item.produtoId, (contagem.get(item.produtoId) || 0) + item.quantidade);
          }
        }
        const produtoPorId = new Map(produtos.map((p) => [p.id, p]));
        const ranking = Array.from(contagem.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([produtoId]) => produtoPorId.get(produtoId))
          .filter((p): p is Produto => !!p && p.disponivel)
          .slice(0, TOP_N);
        setMaisComprados(ranking);
      })
      .catch(() => setMaisComprados([]));
    return () => {
      cancelled = true;
    };
  }, [customer, empresa.id, empresa.habilitarPedirDeNovo]);

  const temItens = useMemo(() => maisComprados.length > 0, [maisComprados]);
  if (!customer || !empresa.habilitarPedirDeNovo || !temItens) return null;

  return (
    <section className="pt-4">
      <div className="container mx-auto px-4">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-3">
          <RotateCcw className="h-4 w-4 text-[var(--cor-primaria)]" /> Peça de novo
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {maisComprados.map((produto) => (
            <button
              key={produto.id}
              onClick={() => onProductClick(produto)}
              className="shrink-0 w-32 text-left bg-white border border-gray-100 rounded-2xl shadow-sm p-2.5 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="w-full h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                {produto.fotoUrl ? (
                  <img src={produto.fotoUrl} alt={produto.nome} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="h-6 w-6 text-gray-300" />
                )}
              </div>
              <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{produto.nome}</p>
              <p className="text-xs font-bold text-[var(--cor-primaria)] mt-1">
                R$ {(produto.precoPromocional ?? produto.preco).toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PedirDeNovoStrip;
