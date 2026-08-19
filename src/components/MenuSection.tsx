import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ProductCard from './ProductCard';
import { Produto } from '../types/Produto';
import { fetchProdutos } from '../lib/produtos';
import { useTenant } from '../context/TenantContext';

interface MenuSectionProps {
  onProductClick: (product: Produto) => void;
}

const SEM_CATEGORIA_ID = '__sem-categoria__';

const MenuSection: React.FC<MenuSectionProps> = ({ onProductClick }) => {
  const { empresa } = useTenant();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaId, setCategoriaId] = useState<string>('todos');

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
    if (categoriaId === 'todos') return produtos;
    if (categoriaId === SEM_CATEGORIA_ID) return produtos.filter((p) => !p.categoria);
    return produtos.filter((p) => p.categoria?.id === categoriaId);
  }, [produtos, categoriaId]);

  return (
    <section id="menu" className="pt-6 pb-4">
      <div className="container mx-auto px-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Cardápio</h2>

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
          <p className="text-center text-gray-400 py-16 text-sm">Nenhum produto disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {filtrados.map((product) => (
              <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuSection;
