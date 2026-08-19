import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import ProductCard from './ProductCard';
import { Produto } from '../types/Produto';
import { fetchProdutos } from '../lib/produtos';
import { fetchFavoritos, addFavorito, removeFavorito } from '../lib/favoritos';
import { useTenant } from '../context/TenantContext';
import { useCustomer } from '../context/CustomerContext';

interface MenuSectionProps {
  onProductClick: (product: Produto) => void;
}

const SEM_CATEGORIA_ID = '__sem-categoria__';

const MenuSection: React.FC<MenuSectionProps> = ({ onProductClick }) => {
  const { empresa } = useTenant();
  const { customer } = useCustomer();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaId, setCategoriaId] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProdutos(empresa.id, true)
      .then((data) => {
        if (!cancelled) setProdutos(data);
      })
      .catch(() => {
        if (!cancelled) setProdutos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [empresa.id]);

  useEffect(() => {
    if (!customer || !empresa.habilitarFavoritos) {
      setFavoritoIds(new Set());
      return;
    }
    fetchFavoritos(empresa.id, customer.id)
      .then((data) => setFavoritoIds(new Set(data.map((f) => f.produtoId))))
      .catch(() => setFavoritoIds(new Set()));
  }, [empresa.id, empresa.habilitarFavoritos, customer]);

  const handleToggleFavorito = useCallback((produtoId: string) => {
    if (!customer || !empresa.habilitarFavoritos) return;
    const jaFavoritado = favoritoIds.has(produtoId);
    setFavoritoIds((prev) => {
      const next = new Set(prev);
      if (jaFavoritado) next.delete(produtoId);
      else next.add(produtoId);
      return next;
    });
    const acao = jaFavoritado
      ? removeFavorito(empresa.id, customer.id, produtoId)
      : addFavorito(empresa.id, customer.id, produtoId);
    acao.catch(() => {
      setFavoritoIds((prev) => {
        const next = new Set(prev);
        if (jaFavoritado) next.add(produtoId);
        else next.delete(produtoId);
        return next;
      });
    });
  }, [customer, empresa.id, favoritoIds]);

  const categorias = useMemo(() => {
    const mapa = new Map<string, { id: string; nome: string; ordem: number }>();
    let temSemCategoria = false;
    for (const p of produtos) {
      if (p.categoria) {
        mapa.set(p.categoria.id, { id: p.categoria.id, nome: p.categoria.nome, ordem: p.categoria.ordem });
      } else {
        temSemCategoria = true;
      }
    }
    const ordenadas = Array.from(mapa.values()).sort((a, b) => a.ordem - b.ordem);
    return [
      { id: 'todos', nome: 'Todos' },
      ...ordenadas,
      ...(temSemCategoria ? [{ id: SEM_CATEGORIA_ID, nome: 'Outros' }] : []),
    ];
  }, [produtos]);

  const filtrados = useMemo(() => {
    let base = produtos;
    if (categoriaId === SEM_CATEGORIA_ID) base = produtos.filter((p) => !p.categoria);
    else if (categoriaId !== 'todos') base = produtos.filter((p) => p.categoria?.id === categoriaId);

    const termo = busca.trim().toLowerCase();
    if (!termo) return base;
    return base.filter(
      (p) => p.nome.toLowerCase().includes(termo) || (p.descricao ?? '').toLowerCase().includes(termo)
    );
  }, [produtos, categoriaId, busca]);

  return (
    <section id="menu" className="pt-6 pb-4">
      <div className="container mx-auto px-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Cardápio</h2>

        {produtos.length > 4 && (
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {categorias.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoriaId(c.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoriaId === c.id
                    ? 'bg-[var(--cor-primaria)] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">
            {busca.trim() ? `Nenhum resultado para "${busca.trim()}".` : 'Nenhum produto disponível no momento.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {filtrados.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
                isFavorito={favoritoIds.has(product.id)}
                onToggleFavorito={customer && empresa.habilitarFavoritos ? () => handleToggleFavorito(product.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuSection;
