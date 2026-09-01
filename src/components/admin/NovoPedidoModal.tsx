import React, { useEffect, useState } from 'react';
import { X, Search, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { fetchProdutos } from '../../lib/produtos';
import { createPedidoComoAdmin } from '../../lib/pedidos';
import { Produto } from '../../types/Produto';
import { TipoPedido, FormaPagamento, TIPO_PEDIDO_LABELS, FORMA_PAGAMENTO_LABELS } from '../../types/Pedido';

interface NovoPedidoModalProps {
  empresaId: string;
  onClose: () => void;
  onCriado: () => void;
}

interface ItemCarrinho {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

const NovoPedidoModal: React.FC<NovoPedidoModalProps> = ({ empresaId, onClose, onCriado }) => {
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('DELIVERY');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [referencia, setReferencia] = useState('');
  const [mesaIdentificador, setMesaIdentificador] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [trocoPara, setTrocoPara] = useState('');

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProdutos(empresaId, true).then(setProdutos).catch(() => setProdutos([]));
  }, [empresaId]);

  const termo = buscaProduto.trim().toLowerCase();
  const produtosFiltrados = termo ? produtos.filter((p) => p.nome.toLowerCase().includes(termo)).slice(0, 8) : [];

  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.produtoId === produto.id);
      if (existente) {
        return prev.map((i) => (i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { produtoId: produto.id, nome: produto.nome, preco: produto.precoPromocional ?? produto.preco, quantidade: 1 }];
    });
    setBuscaProduto('');
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho((prev) => prev.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i)).filter((i) => i.quantidade > 0));
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho((prev) => prev.filter((i) => i.produtoId !== produtoId));
  };

  const subtotal = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (carrinho.length === 0) {
      setError('Adicione ao menos 1 item ao pedido.');
      return;
    }
    if (tipoPedido === 'DELIVERY' && (!clienteNome || !clienteTelefone || !endereco)) {
      setError('Pra Delivery, informe nome, telefone e endereço do cliente.');
      return;
    }

    setSaving(true);
    try {
      await createPedidoComoAdmin(empresaId, {
        tipoPedido,
        clienteNome: clienteNome || undefined,
        clienteTelefone: clienteTelefone || undefined,
        endereco: endereco || undefined,
        bairro: bairro || undefined,
        referencia: referencia || undefined,
        mesaIdentificador: tipoPedido === 'MESA' ? mesaIdentificador || undefined : undefined,
        observacoes: observacoes || undefined,
        formaPagamento,
        trocoPara: formaPagamento === 'DINHEIRO' && trocoPara ? parseFloat(trocoPara) : undefined,
        itens: carrinho.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      });
      onCriado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Novo pedido</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIPO_PEDIDO_LABELS) as TipoPedido[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoPedido(t)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${tipoPedido === t ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {TIPO_PEDIDO_LABELS[t]}
              </button>
            ))}
          </div>

          {tipoPedido === 'MESA' && (
            <input
              value={mesaIdentificador}
              onChange={(e) => setMesaIdentificador(e.target.value)}
              placeholder="Identificação da mesa (ex: Mesa 5)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <input
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder={tipoPedido === 'DELIVERY' ? 'Nome do cliente*' : 'Nome do cliente (opcional)'}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              placeholder={tipoPedido === 'DELIVERY' ? 'Telefone*' : 'Telefone (opcional)'}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {tipoPedido === 'DELIVERY' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Endereço*"
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Referência" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}

          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Buscar produto pra adicionar..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            {produtosFiltrados.length > 0 && (
              <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden">
                {produtosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => adicionarAoCarrinho(p)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <span>{p.nome}</span>
                    <span className="text-orange-600 font-medium">R$ {(p.precoPromocional ?? p.preco).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {carrinho.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              {carrinho.map((item) => (
                <div key={item.produtoId} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-gray-700">{item.nome}</span>
                  <button type="button" onClick={() => alterarQuantidade(item.produtoId, -1)} className="text-gray-400 hover:text-gray-700"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-5 text-center">{item.quantidade}</span>
                  <button type="button" onClick={() => alterarQuantidade(item.produtoId, 1)} className="text-gray-400 hover:text-gray-700"><Plus className="h-3.5 w-3.5" /></button>
                  <span className="w-16 text-right font-medium text-gray-800">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                  <button type="button" onClick={() => removerDoCarrinho(item.produtoId)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t border-gray-200">
                <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {(['PIX', 'DINHEIRO', 'CARTAO'] as FormaPagamento[]).map((f) => (
                <option key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</option>
              ))}
            </select>
            {formaPagamento === 'DINHEIRO' && (
              <input
                type="number"
                step="0.01"
                value={trocoPara}
                onChange={(e) => setTrocoPara(e.target.value)}
                placeholder="Troco para quanto?"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            )}
          </div>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações (opcional)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {saving ? 'Criando...' : 'Criar pedido'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NovoPedidoModal;
