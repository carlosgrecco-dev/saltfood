import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Wallet, MinusCircle, Bike, Loader2, ClipboardCheck } from 'lucide-react';
import { MovimentoCaixa, TipoMovimentoCaixa, TIPO_MOVIMENTO_LABELS } from '../../types/MovimentoCaixa';
import { Motoboy } from '../../types/Motoboy';
import { fetchMovimentosCaixa, createMovimentoCaixa, deleteMovimentoCaixa } from '../../lib/movimentosCaixa';
import { fetchMotoboys } from '../../lib/motoboysApi';
import { fetchPedidos, pagarMotoboy, fetchConferenciaMotoboys, ConferenciaMotoboys } from '../../lib/pedidos';

interface CaixaTabProps {
  empresaId: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

interface PendenciaMotoboy {
  motoboy: Motoboy;
  corridas: number;
  total: number;
}

const CaixaTab: React.FC<CaixaTabProps> = ({ empresaId }) => {
  const [data, setData] = useState(todayISO());
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [novoMovimento, setNovoMovimento] = useState<{ tipo: TipoMovimentoCaixa; descricao: string; valor: string }>({
    tipo: 'SAIDA',
    descricao: '',
    valor: '',
  });
  const [saving, setSaving] = useState(false);

  const [pendencias, setPendencias] = useState<PendenciaMotoboy[]>([]);
  const [loadingPendencias, setLoadingPendencias] = useState(true);
  const [payingMotoboyId, setPayingMotoboyId] = useState<string | null>(null);

  const [conferencia, setConferencia] = useState<ConferenciaMotoboys | null>(null);
  const [loadingConferencia, setLoadingConferencia] = useState(true);

  const loadMovimentos = useCallback(async () => {
    try {
      setMovimentos(await fetchMovimentosCaixa(empresaId, { de: data, ate: data }));
    } catch {
      /* silencioso */
    }
  }, [empresaId, data]);

  const loadPendencias = useCallback(async () => {
    setLoadingPendencias(true);
    try {
      const motoboys = await fetchMotoboys(empresaId, true);
      const resultado = await Promise.all(
        motoboys.map(async (motoboy) => {
          const entregues = await fetchPedidos(empresaId, { motoboyId: motoboy.id, status: 'ENTREGUE', motoboyPago: false });
          const total = entregues.reduce((sum, p) => sum + (p.taxaEntregaMotoboy ?? 0), 0);
          return { motoboy, corridas: entregues.length, total };
        })
      );
      setPendencias(resultado.filter((p) => p.corridas > 0));
    } catch {
      setPendencias([]);
    } finally {
      setLoadingPendencias(false);
    }
  }, [empresaId]);

  const loadConferencia = useCallback(async () => {
    setLoadingConferencia(true);
    try {
      setConferencia(await fetchConferenciaMotoboys(empresaId, data, data));
    } catch {
      setConferencia(null);
    } finally {
      setLoadingConferencia(false);
    }
  }, [empresaId, data]);

  useEffect(() => {
    loadMovimentos();
  }, [loadMovimentos]);

  useEffect(() => {
    loadPendencias();
  }, [loadPendencias]);

  useEffect(() => {
    loadConferencia();
  }, [loadConferencia]);

  const handleCreateMovimento = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(novoMovimento.valor);
    if (!novoMovimento.descricao || !valor || valor <= 0) return;
    setSaving(true);
    try {
      await createMovimentoCaixa(empresaId, {
        tipo: novoMovimento.tipo,
        descricao: novoMovimento.descricao,
        valor,
        dataMovimento: data,
      });
      setNovoMovimento({ tipo: 'SAIDA', descricao: '', valor: '' });
      loadMovimentos();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMovimento = async (id: string) => {
    if (!window.confirm('Remover este lançamento?')) return;
    await deleteMovimentoCaixa(empresaId, id);
    loadMovimentos();
  };

  const handlePagarMotoboy = async (motoboyId: string) => {
    setPayingMotoboyId(motoboyId);
    try {
      await pagarMotoboy(empresaId, motoboyId);
      await Promise.all([loadPendencias(), loadMovimentos()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao registrar pagamento');
    } finally {
      setPayingMotoboyId(null);
    }
  };

  const entradas = movimentos.filter((m) => m.tipo === 'ENTRADA').reduce((sum, m) => sum + m.valor, 0);
  const saidas = movimentos.filter((m) => m.tipo === 'SAIDA' || m.tipo === 'SANGRIA').reduce((sum, m) => sum + m.valor, 0);
  const saldo = entradas - saidas;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Data de referência:</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-2xl">
          <p className="text-emerald-100 text-xs mb-1 flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" /> Entradas
          </p>
          <p className="text-xl font-bold">R$ {entradas.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-2xl">
          <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
            <MinusCircle className="h-3.5 w-3.5" /> Saídas / Sangrias
          </p>
          <p className="text-xl font-bold text-red-600">R$ {saidas.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 text-white p-4 rounded-2xl">
          <p className="text-gray-300 text-xs mb-1">Saldo do dia</p>
          <p className="text-xl font-bold">R$ {saldo.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Bike className="h-4 w-4 text-orange-600" /> Pagamentos pendentes a motoboys
        </h3>

        {loadingPendencias ? (
          <p className="text-center text-gray-500 py-6 text-sm flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando...
          </p>
        ) : pendencias.length === 0 ? (
          <p className="text-center text-gray-500 py-6 text-sm">Nenhum pagamento pendente. Tudo em dia!</p>
        ) : (
          <div className="space-y-2">
            {pendencias.map(({ motoboy, corridas, total }) => (
              <div key={motoboy.id} className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 rounded-xl p-4">
                <div>
                  <p className="font-bold text-gray-800">{motoboy.nome}</p>
                  <p className="text-sm text-gray-500">{corridas} corrida(s) entregue(s) e não pagas</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-orange-600">R$ {total.toFixed(2)}</span>
                  <button
                    onClick={() => handlePagarMotoboy(motoboy.id)}
                    disabled={payingMotoboyId === motoboy.id}
                    className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-60"
                  >
                    {payingMotoboyId === motoboy.id ? 'Pagando...' : 'Pagar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-orange-600" /> Conferência de recebimento por motoboy
        </h3>

        {loadingConferencia ? (
          <p className="text-center text-gray-500 py-6 text-sm flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando...
          </p>
        ) : !conferencia || conferencia.motoboys.length === 0 ? (
          <p className="text-center text-gray-500 py-6 text-sm">Nenhuma entrega confirmada nesta data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Motoboy</th>
                  <th className="text-right px-4 py-2">Pix</th>
                  <th className="text-right px-4 py-2">Dinheiro</th>
                  <th className="text-right px-4 py-2">Cartão</th>
                  <th className="text-right px-4 py-2">Total</th>
                  <th className="text-right px-4 py-2">Entregas</th>
                </tr>
              </thead>
              <tbody>
                {conferencia.motoboys.map((m) => (
                  <tr key={m.motoboyId} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-800">{m.motoboyNome}</td>
                    <td className="px-4 py-2 text-right">R$ {m.totais.PIX.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">R$ {m.totais.DINHEIRO.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">R$ {m.totais.CARTAO.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-bold text-orange-600">R$ {m.total.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{m.entregas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {conferencia.naoConfirmados > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {conferencia.naoConfirmados} entrega(s) nesta data sem confirmação de recebimento — não entram nos totais acima.
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <MinusCircle className="h-4 w-4 text-red-600" /> Lançamentos do dia
        </h3>

        <form onSubmit={handleCreateMovimento} className="flex flex-wrap gap-3 mb-4 bg-gray-50 p-4 rounded-xl items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select
              value={novoMovimento.tipo}
              onChange={(e) => setNovoMovimento({ ...novoMovimento, tipo: e.target.value as TipoMovimentoCaixa })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="SANGRIA">Sangria</option>
            </select>
          </div>
          <input
            placeholder="Descrição (ex: retirada para depósito, compra de gelo...)"
            value={novoMovimento.descricao}
            onChange={(e) => setNovoMovimento({ ...novoMovimento, descricao: e.target.value })}
            className="flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={novoMovimento.valor}
            onChange={(e) => setNovoMovimento({ ...novoMovimento, valor: e.target.value })}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> <span>Lançar</span>
          </button>
        </form>

        <div className="space-y-2">
          {movimentos.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    m.tipo === 'ENTRADA'
                      ? 'bg-green-100 text-green-800'
                      : m.tipo === 'SANGRIA'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {TIPO_MOVIMENTO_LABELS[m.tipo]}
                </span>
                <span className="text-sm text-gray-700">{m.descricao}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${m.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.tipo === 'ENTRADA' ? '+' : '-'} R$ {m.valor.toFixed(2)}
                </span>
                <button onClick={() => handleDeleteMovimento(m.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {movimentos.length === 0 && (
            <p className="text-center text-gray-500 py-6 text-sm">Nenhum lançamento nesta data.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaixaTab;
