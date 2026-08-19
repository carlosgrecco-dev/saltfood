import React from 'react';
import { Plus, ImageOff } from 'lucide-react';
import { Produto } from '../types/Produto';

interface ProductCardProps {
  product: Produto;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const precoFinal = product.precoPromocional ?? product.preco;
  const emPromocao = product.precoPromocional != null && product.precoPromocional < product.preco;
  const indisponivel = !product.disponivel;

  return (
    <div
      onClick={indisponivel ? undefined : onClick}
      className={`flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-150 p-3 ${
        indisponivel ? 'opacity-60' : 'hover:shadow-md active:scale-[0.98] cursor-pointer'
      }`}
    >
      <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
        {product.fotoUrl ? (
          <img src={product.fotoUrl} alt={product.nome} className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="h-7 w-7 text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-800 truncate">{product.nome}</h3>
        {product.descricao && (
          <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mt-0.5">{product.descricao}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {indisponivel ? (
            <span className="text-[11px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Esgotado</span>
          ) : (
            <>
              {emPromocao && (
                <span className="text-gray-400 text-xs line-through">R$ {product.preco.toFixed(2)}</span>
              )}
              <p className="text-[var(--cor-primaria)] font-bold">R$ {precoFinal.toFixed(2)}</p>
            </>
          )}
        </div>
      </div>

      {!indisponivel && (
        <button
          className="shrink-0 bg-[var(--cor-primaria)] hover:brightness-110 text-white rounded-full p-2.5 shadow-md transition-all"
          aria-label={`Adicionar ${product.nome}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ProductCard;
