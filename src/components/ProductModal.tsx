import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, ShoppingCart, ImageOff, AlertCircle } from 'lucide-react';
import { Produto, ProdutoGrupoOpcao } from '../types/Produto';
import { useCart } from '../context/CartContext';
import BottomSheet from './BottomSheet';

/** Grupo obrigatório de escolha única, com fotos nas opções, vira um seletor de "formato" em cartões (ex: No Saquinho x No Prato). */
const isGrupoFormato = (grupo: ProdutoGrupoOpcao) =>
  grupo.obrigatorio && !grupo.selecaoMultipla && grupo.opcoes.some((o) => o.fotoUrl);

interface ProductModalProps {
  product: Produto;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);
  const [selecoes, setSelecoes] = useState<Record<string, string[]>>({});
  const [showValidation, setShowValidation] = useState(false);

  const precoBase = product.precoPromocional ?? product.preco;
  const grupos = useMemo(() => product.gruposOpcao ?? [], [product.gruposOpcao]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      setAdded(false);
      setShowValidation(false);
      const padrao: Record<string, string[]> = {};
      for (const grupo of grupos) {
        const marcadas = grupo.opcoes.filter((o) => o.selecionadoPorPadrao).map((o) => o.id);
        if (marcadas.length > 0) padrao[grupo.id] = marcadas;
      }
      setSelecoes(padrao);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product.id]);

  const precoAdicionais = useMemo(() => {
    let total = 0;
    for (const grupo of grupos) {
      const selecionadas = selecoes[grupo.id] ?? [];
      for (const opcaoId of selecionadas) {
        const opcao = grupo.opcoes.find((o) => o.id === opcaoId);
        if (opcao) total += opcao.precoAdicional;
      }
    }
    return total;
  }, [grupos, selecoes]);

  const precoFinal = precoBase + precoAdicionais;
  const subtotal = precoFinal * quantity;

  const grupoInvalido = (grupoId: string) => {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return false;
    const qtd = (selecoes[grupoId] ?? []).length;
    const minEfetivo = grupo.obrigatorio ? Math.max(1, grupo.minSelecoes) : grupo.minSelecoes;
    return qtd < minEfetivo;
  };

  const algumGrupoInvalido = grupos.some((g) => grupoInvalido(g.id));

  const handleToggleOpcao = (grupoId: string, opcaoId: string, selecaoMultipla: boolean, maxSelecoes: number | null) => {
    setSelecoes((prev) => {
      const atuais = prev[grupoId] ?? [];
      if (!selecaoMultipla) {
        return { ...prev, [grupoId]: atuais.includes(opcaoId) ? [] : [opcaoId] };
      }
      if (atuais.includes(opcaoId)) {
        return { ...prev, [grupoId]: atuais.filter((id) => id !== opcaoId) };
      }
      const max = maxSelecoes ?? Infinity;
      if (atuais.length >= max) return prev;
      return { ...prev, [grupoId]: [...atuais, opcaoId] };
    });
  };

  const handleAddToCart = () => {
    if (algumGrupoInvalido) {
      setShowValidation(true);
      return;
    }

    const options = grupos.flatMap((grupo) =>
      (selecoes[grupo.id] ?? []).map((opcaoId) => {
        const opcao = grupo.opcoes.find((o) => o.id === opcaoId)!;
        return {
          optionId: opcao.id,
          groupName: grupo.nome,
          optionName: opcao.nome,
          additionalPrice: opcao.precoAdicional,
        };
      })
    );

    addItem({
      productId: product.id,
      name: product.nome,
      unitPrice: precoFinal,
      quantity,
      notes: notes.trim() || undefined,
      image: product.fotoUrl || undefined,
      options: options.length > 0 ? options : undefined,
    });
    setAdded(true);
    setTimeout(() => onClose(), 600);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} hideHeader>
      <div className="relative">
        {product.fotoUrl ? (
          <img src={product.fotoUrl} alt={product.nome} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <ImageOff className="h-10 w-10 text-gray-300" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h2 className="text-xl font-bold text-white">{product.nome}</h2>
          <p className="text-yellow-300 font-bold text-lg">R$ {precoFinal.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {grupos.filter(isGrupoFormato).map((grupo) => {
          const selecionadas = selecoes[grupo.id] ?? [];
          const invalido = showValidation && grupoInvalido(grupo.id);
          return (
            <div key={grupo.id}>
              <p className="text-gray-800 font-bold text-base mb-3 text-center">{grupo.nome}</p>
              <div className="grid grid-cols-2 gap-3">
                {grupo.opcoes.map((opcao) => {
                  const checked = selecionadas.includes(opcao.id);
                  const precoOpcao = precoBase + opcao.precoAdicional;
                  return (
                    <button
                      type="button"
                      key={opcao.id}
                      onClick={() => handleToggleOpcao(grupo.id, opcao.id, grupo.selecaoMultipla, grupo.maxSelecoes)}
                      className={`text-left border-2 rounded-2xl overflow-hidden transition-all ${
                        checked ? 'border-[var(--cor-primaria)] shadow-md' : 'border-gray-200'
                      }`}
                    >
                      {opcao.fotoUrl ? (
                        <img src={opcao.fotoUrl} alt={opcao.nome} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                          <ImageOff className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-bold text-gray-800 text-sm">{opcao.nome}</p>
                        {opcao.descricao && (
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{opcao.descricao}</p>
                        )}
                        <p className="mt-2 inline-block bg-gradient-to-r from-[var(--cor-primaria)] to-[var(--cor-secundaria)] text-white text-xs font-bold px-3 py-1 rounded-full">
                          R$ {precoOpcao.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {invalido && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Selecione uma opção
                </p>
              )}
            </div>
          );
        })}

        {product.descricao && <p className="text-gray-600 text-sm leading-relaxed">{product.descricao}</p>}

        {grupos.filter((g) => !isGrupoFormato(g)).map((grupo) => {
          const selecionadas = selecoes[grupo.id] ?? [];
          const invalido = showValidation && grupoInvalido(grupo.id);
          return (
            <div key={grupo.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-800 font-bold text-sm">{grupo.nome}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${grupo.obrigatorio ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  {grupo.obrigatorio ? 'Obrigatório' : 'Opcional'}
                  {grupo.selecaoMultipla && grupo.maxSelecoes ? ` · até ${grupo.maxSelecoes}` : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {grupo.opcoes.map((opcao) => {
                  const checked = selecionadas.includes(opcao.id);
                  return (
                    <label
                      key={opcao.id}
                      className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                        checked ? 'border-[var(--cor-primaria)] bg-orange-50/40' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type={grupo.selecaoMultipla ? 'checkbox' : 'radio'}
                        name={`grupo-${grupo.id}`}
                        checked={checked}
                        onChange={() => handleToggleOpcao(grupo.id, opcao.id, grupo.selecaoMultipla, grupo.maxSelecoes)}
                        className="w-4 h-4 text-[var(--cor-primaria)] shrink-0"
                      />
                      <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">{opcao.nome}</span>
                      {opcao.precoAdicional > 0 && (
                        <span className="text-xs font-semibold text-gray-500 shrink-0">+R$ {opcao.precoAdicional.toFixed(2)}</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {invalido && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Selecione ao menos {Math.max(1, grupo.minSelecoes)} opção(ões)
                </p>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium text-sm">Quantidade</span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-lg font-bold w-6 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2 text-sm">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: sem cebola, bem passado, pouca pimenta..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm resize-none"
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 safe-bottom">
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-[var(--cor-primaria)] to-[var(--cor-secundaria)] text-white py-3.5 rounded-xl font-bold text-base hover:brightness-110 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>{added ? 'Adicionado! ✓' : `Adicionar · R$ ${subtotal.toFixed(2)}`}</span>
        </button>
      </div>
    </BottomSheet>
  );
};

export default ProductModal;
