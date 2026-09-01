import React, { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Produto } from '../../types/Produto';
import BottomSheet from '../BottomSheet';

interface PdvOpcoesModalProps {
  produto: Produto | null;
  onClose: () => void;
  onConfirmar: (opcoesIds: string[], quantidade: number, observacoes: string) => void;
}

/** Picker compacto de grupos de opção pro PDV — versão enxuta do ProductModal do storefront,
 * sem depender do CartContext do cliente (o PDV monta o próprio carrinho local). */
const PdvOpcoesModal: React.FC<PdvOpcoesModalProps> = ({ produto, onClose, onConfirmar }) => {
  const [selecoes, setSelecoes] = useState<Record<string, string[]>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (produto) {
      setSelecoes({});
      setQuantidade(1);
      setObservacoes('');
      setErro('');
    }
  }, [produto]);

  if (!produto) return null;

  const grupos = produto.gruposOpcao || [];
  const precoBase = produto.precoPromocional ?? produto.preco;

  const toggleOpcao = (grupoId: string, opcaoId: string, selecaoMultipla: boolean, maxSelecoes: number | null) => {
    setSelecoes((prev) => {
      const atuais = prev[grupoId] || [];
      if (!selecaoMultipla) {
        return { ...prev, [grupoId]: atuais.includes(opcaoId) ? [] : [opcaoId] };
      }
      if (atuais.includes(opcaoId)) {
        return { ...prev, [grupoId]: atuais.filter((id) => id !== opcaoId) };
      }
      const limite = maxSelecoes ?? Infinity;
      if (atuais.length >= limite) return prev;
      return { ...prev, [grupoId]: [...atuais, opcaoId] };
    });
  };

  const precoAdicional = grupos.reduce((soma, g) => {
    const selecionadas = selecoes[g.id] || [];
    return soma + selecionadas.reduce((s, opId) => s + (g.opcoes.find((o) => o.id === opId)?.precoAdicional || 0), 0);
  }, 0);
  const total = (precoBase + precoAdicional) * quantidade;

  const handleConfirmar = () => {
    for (const g of grupos) {
      const selecionadas = selecoes[g.id] || [];
      const minEfetivo = g.obrigatorio ? Math.max(1, g.minSelecoes) : g.minSelecoes;
      if (selecionadas.length < minEfetivo) {
        setErro(`Selecione ao menos ${minEfetivo} opção(ões) em "${g.nome}"`);
        return;
      }
    }
    const todasOpcoes = Object.values(selecoes).flat();
    onConfirmar(todasOpcoes, quantidade, observacoes);
  };

  return (
    <BottomSheet isOpen={!!produto} onClose={onClose} title={produto.nome}>
      <div className="p-6 space-y-5">
        {grupos.map((g) => (
          <div key={g.id}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-800 text-sm">{g.nome}</p>
              <span className="text-[11px] text-gray-400">
                {g.obrigatorio ? 'Obrigatório' : 'Opcional'}{g.selecaoMultipla && g.maxSelecoes ? ` · até ${g.maxSelecoes}` : ''}
              </span>
            </div>
            <div className="space-y-1.5">
              {g.opcoes.filter((o) => o.ativo).map((o) => {
                const marcado = (selecoes[g.id] || []).includes(o.id);
                return (
                  <label key={o.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border cursor-pointer ${marcado ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type={g.selecaoMultipla ? 'checkbox' : 'radio'}
                        checked={marcado}
                        onChange={() => toggleOpcao(g.id, o.id, g.selecaoMultipla, g.maxSelecoes)}
                        className="text-orange-600"
                      />
                      {o.nome}
                    </span>
                    {o.precoAdicional > 0 && <span className="text-xs font-semibold text-gray-500 shrink-0">+R$ {o.precoAdicional.toFixed(2)}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Observações</label>
          <input
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: sem cebola"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1.5">
            <button type="button" onClick={() => setQuantidade((q) => Math.max(1, q - 1))} className="text-gray-500 hover:text-gray-800"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-medium">{quantidade}</span>
            <button type="button" onClick={() => setQuantidade((q) => q + 1)} className="text-gray-500 hover:text-gray-800"><Plus className="h-4 w-4" /></button>
          </div>
          <button
            onClick={handleConfirmar}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg"
          >
            Adicionar · R$ {total.toFixed(2)}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default PdvOpcoesModal;
