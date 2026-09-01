import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle2, RotateCcw, AlertTriangle, HandCoins } from 'lucide-react';
import { ContaReceber, StatusConta } from '../../types/ContaFinanceira';
import { fetchContasReceber, createContaReceber, updateContaReceber, deleteContaReceber } from '../../lib/contasReceber';

interface ContasReceberTabProps {
  empresaId: string;
}

type Filtro = 'PENDENTE' | 'PAGO' | 'TODAS';

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = { descricao: '', clienteNome: '', valor: '', vencimento: todayISO(), observacoes: '' };

const ContasReceberTab: React.FC<ContasReceberTabProps> = ({ empresaId }) => {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('PENDENTE');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContas(await fetchContasReceber(empresaId, filtro === 'TODAS' ? undefined : (filtro as StatusConta)));
    } catch {
      setContas([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId, filtro]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (!form.descricao.trim() || !Number.isFinite(valor) || valor <= 0 || !form.vencimento) return;
    setSalvando(true);
    try {
      await createContaReceber(empresaId, {
        descricao: form.descricao.trim(),
        clienteNome: form.clienteNome.trim() || undefined,
        valor,
        vencimento: form.vencimento,
        observacoes: form.observacoes.trim() || undefined,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível registrar a conta.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatus = async (conta: ContaReceber) => {
    setProcessandoId(conta.id);
    try {
      await updateContaReceber(empresaId, conta.id, { status: conta.status === 'PAGO' ? 'PENDENTE' : 'PAGO' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar a conta.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Remover esta conta?')) return;
    await deleteContaReceber(empresaId, id);
    await load();
  };

  const totalPendente = contas.filter((c) => c.status === 'PENDENTE').reduce((s, c) => s + c.valor, 0);
  const vencidas = contas.filter((c) => c.status === 'PENDENTE' && c.vencimento.slice(0, 10) < todayISO());

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><HandCoins className="h-3.5 w-3.5" /> Total a receber (filtro atual)</p>
          <p className="text-xl font-bold text-emerald-600">R$ {totalPendente.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Vencidas</p>
          <p className="text-xl font-bold text-amber-600">{vencidas.length}</p>
        </div>
      </div>

      <form onSubmit={handleCriar} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Descrição</label>
          <input
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex: Fiado, encomenda combinada..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Cliente (opcional)</label>
          <input
            value={form.clienteNome}
            onChange={(e) => setForm({ ...form, clienteNome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Vencimento</label>
          <input
            type="date"
            value={form.vencimento}
            onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Valor</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>
        <button type="submit" disabled={salvando} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">
          <Plus className="h-4 w-4" /> Registrar
        </button>
      </form>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-4 max-w-xs">
        {(['PENDENTE', 'PAGO', 'TODAS'] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === f ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}
          >
            {f === 'PENDENTE' ? 'Pendentes' : f === 'PAGO' ? 'Recebidas' : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {contas.map((c) => {
            const vencida = c.status === 'PENDENTE' && c.vencimento.slice(0, 10) < todayISO();
            return (
              <div key={c.id} className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl px-4 py-3 ${vencida ? 'border-red-200 bg-red-50/40' : 'border-gray-200'}`}>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{c.descricao}</p>
                  <p className="text-xs text-gray-500">
                    {c.clienteNome ? `${c.clienteNome} · ` : ''}
                    Vence em {new Date(`${c.vencimento.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')}
                    {vencida ? ' · vencida' : ''}
                    {c.status === 'PAGO' && c.recebidoEm ? ` · recebida em ${new Date(c.recebidoEm).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-gray-800">R$ {c.valor.toFixed(2)}</span>
                  <button
                    onClick={() => handleAlternarStatus(c)}
                    disabled={processandoId === c.id}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-60 ${
                      c.status === 'PAGO' ? 'border border-gray-300 text-gray-600 hover:bg-gray-50' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {c.status === 'PAGO' ? <><RotateCcw className="h-3.5 w-3.5" /> Reabrir</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Marcar como recebida</>}
                  </button>
                  <button onClick={() => handleExcluir(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
          {contas.length === 0 && <p className="text-center text-gray-500 py-10 text-sm">Nenhuma conta a receber aqui.</p>}
        </div>
      )}
    </div>
  );
};

export default ContasReceberTab;
