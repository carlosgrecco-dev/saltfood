import React, { useEffect, useState } from 'react';
import { X, Search, Plus, Trash2, Loader2 } from 'lucide-react';
import { fetchProdutos } from '../../lib/produtos';
import { updatePedido, addItensPedido, removeItemPedido } from '../../lib/pedidos';
import { Produto } from '../../types/Produto';
import { Pedido, FormaPagamento, FORMA_PAGAMENTO_LABELS } from '../../types/Pedido';

interface EditarPedidoModalProps {
  empresaId: string;
  pedido: Pedido;
  onClose: () => void;
  onSalvo: () => void;
}

const EditarPedidoModal: React.FC<EditarPedidoModalProps> = ({ empresaId, pedido, onClose, onSalvo }) => {
  const [clienteNome, setClienteNome] = useState(pedido.clienteNome || '');
  const [clienteTelefone, setClienteTelefone] = useState(pedido.clienteTelefone || '');
  const [endereco, setEndereco] = useState(pedido.endereco || '');
  const [bairro, setBairro] = useState(pedido.bairro || '');
  const [referencia, setReferencia] = useState(pedido.referencia || '');
  const [observacoes, setObservacoes] = useState(pedido.observacoes || '');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(pedido.formaPagamento === 'MULTIPLO' ? 'PIX' : pedido.formaPagamento);
  const [trocoPara, setTrocoPara] = useState(pedido.trocoPara != null ? String(pedido.trocoPara) : '');

  const [itens, setItens] = useState(pedido.itens);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProdutos(empresaId, true).then(setProdutos).catch(() => setProdutos([]));
  }, [empresaId]);

  const termo = buscaProduto.trim().toLowerCase();
  const produtosFiltrados = termo ? produtos.filter((p) => p.nome.toLowerCase().includes(termo)).slice(0, 8) : [];

  const handleAdicionarItem = async (produto: Produto) => {
    setAdicionando(true);
    setError('');
    try {
      const atualizado = await addItensPedido(empresaId, pedido.id, [{ produtoId: produto.id, quantidade: 1 }]);
      setItens(atualizado.itens);
      setBuscaProduto('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item');
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemoverItem = async (itemId: string) => {
    if (itens.length <= 1) {
      setError('O pedido precisa ter ao menos 1 item — remova o pedido inteiro se for o caso.');
      return;
    }
    setRemovendoId(itemId);
    setError('');
    try {
      const atualizado = await removeItemPedido(empresaId, pedido.id, itemId);
      setItens(atualizado.itens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover item');
    } finally {
      setRemovendoId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updatePedido(empresaId, pedido.id, {
        clienteNome,
        clienteTelefone,
        endereco,
        bairro,
        referencia,
        observacoes,
        formaPagamento,
        trocoPara: formaPagamento === 'DINHEIRO' && trocoPara ? parseFloat(trocoPara) : null,
      });
      onSalvo();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const total = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0) + pedido.taxaEntrega - (pedido.descontoCupom || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Editar pedido #{String(pedido.numero).padStart(4, '0')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="Telefone" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>

          {pedido.tipoPedido === 'DELIVERY' && (
            <div className="grid grid-cols-2 gap-3">
              <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Referência" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {(['PIX', 'DINHEIRO', 'CARTAO'] as FormaPagamento[]).map((f) => (
                <option key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</option>
              ))}
            </select>
            {formaPagamento === 'DINHEIRO' && (
              <input type="number" step="0.01" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value)} placeholder="Troco para quanto?" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            )}
          </div>

          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Itens do pedido</p>
            <div className="space-y-1.5 mb-2">
              {itens.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="flex-1 text-gray-700">{item.quantidade}x {item.nomeProduto}</span>
                  <span className="text-gray-600">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoverItem(item.id)}
                    disabled={removendoId === item.id}
                    className="text-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    {removendoId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Buscar produto pra adicionar..."
                disabled={adicionando}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-60"
              />
            </div>
            {produtosFiltrados.length > 0 && (
              <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden">
                {produtosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAdicionarItem(p)}
                    disabled={adicionando}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 disabled:opacity-60"
                  >
                    <span className="flex items-center gap-1.5"><Plus className="h-3 w-3" /> {p.nome}</span>
                    <span className="text-orange-600 font-medium">R$ {(p.precoPromocional ?? p.preco).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 mt-2 border-t border-gray-100">
              <span>Total do pedido</span><span className="text-orange-600">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditarPedidoModal;
