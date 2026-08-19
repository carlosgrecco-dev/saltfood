import React, { useEffect, useState } from 'react';
import { Heart, ImageOff, Trash2 } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useTenant } from '../context/TenantContext';
import { useCustomer } from '../context/CustomerContext';
import { fetchFavoritos, removeFavorito } from '../lib/favoritos';
import { Favorito } from '../types/Favorito';

interface FavoritosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoritosModal: React.FC<FavoritosModalProps> = ({ isOpen, onClose }) => {
  const { empresa } = useTenant();
  const { customer } = useCustomer();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !customer) return;
    setLoading(true);
    fetchFavoritos(empresa.id, customer.id)
      .then(setFavoritos)
      .catch(() => setFavoritos([]))
      .finally(() => setLoading(false));
  }, [isOpen, empresa.id, customer]);

  const handleRemove = async (produtoId: string) => {
    if (!customer) return;
    setRemovingId(produtoId);
    try {
      await removeFavorito(empresa.id, customer.id, produtoId);
      setFavoritos((prev) => prev.filter((f) => f.produtoId !== produtoId));
    } catch {
      /* falha silenciosa — o item continua na lista, o usuário pode tentar de novo */
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Meus Favoritos" zIndexClass="z-[60]">
      <div className="p-5 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-6">Carregando...</p>
        ) : favoritos.length === 0 ? (
          <div className="text-center py-10">
            <Heart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Você ainda não favoritou nenhum produto. Toque no coração no cardápio pra guardar aqui.
            </p>
          </div>
        ) : (
          favoritos.map((favorito) => (
            <div
              key={favorito.id}
              className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3"
            >
              <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {favorito.produto.fotoUrl ? (
                  <img src={favorito.produto.fotoUrl} alt={favorito.produto.nome} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate text-sm">{favorito.produto.nome}</p>
                <p className="text-[var(--cor-primaria)] font-bold text-sm">
                  R$ {(favorito.produto.precoPromocional ?? favorito.produto.preco).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => handleRemove(favorito.produtoId)}
                disabled={removingId === favorito.produtoId}
                className="shrink-0 text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                aria-label={`Remover ${favorito.produto.nome} dos favoritos`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};

export default FavoritosModal;
