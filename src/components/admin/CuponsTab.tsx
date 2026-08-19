import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Ticket } from 'lucide-react';
import { fetchCupons, createCupom, updateCupom, setCupomStatus, deleteCupom } from '../../lib/cupons';
import { Cupom, CupomInput, TipoCupom, TIPO_CUPOM_LABELS } from '../../types/Cupom';

interface CuponsTabProps {
  empresaId: string;
}

const emptyForm = {
  codigo: '',
  descricao: '',
  tipo: 'PERCENTUAL' as TipoCupom,
  valor: '',
  apenasPrimeiraCompra: false,
  valorMinimoPedido: '',
  usoMaximo: '',
  validoAte: '',
};

const CuponsTab: React.FC<CuponsTabProps> = ({ empresaId }) => {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCupons(await fetchCupons(empresaId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (cupom: Cupom) => {
    setEditingId(cupom.id);
    setForm({
      codigo: cupom.codigo,
      descricao: cupom.descricao || '',
      tipo: cupom.tipo,
      valor: cupom.valor != null ? String(cupom.valor) : '',
      apenasPrimeiraCompra: cupom.apenasPrimeiraCompra,
      valorMinimoPedido: cupom.valorMinimoPedido != null ? String(cupom.valorMinimoPedido) : '',
      usoMaximo: cupom.usoMaximo != null ? String(cupom.usoMaximo) : '',
      validoAte: cupom.validoAte ? cupom.validoAte.slice(0, 10) : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.codigo) {
      setError('Informe o código do cupom.');
      return;
    }
    if (form.tipo !== 'FRETE_GRATIS' && (!form.valor || Number(form.valor) <= 0)) {
      setError('Informe um valor maior que zero.');
      return;
    }

    const payload: CupomInput = {
      codigo: form.codigo,
      descricao: form.descricao || undefined,
      tipo: form.tipo,
      valor: form.tipo !== 'FRETE_GRATIS' ? Number(form.valor) : undefined,
      apenasPrimeiraCompra: form.apenasPrimeiraCompra,
      valorMinimoPedido: form.valorMinimoPedido ? Number(form.valorMinimoPedido) : undefined,
      usoMaximo: form.usoMaximo ? Number(form.usoMaximo) : undefined,
      validoAte: form.validoAte || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateCupom(empresaId, editingId, payload);
      } else {
        await createCupom(empresaId, payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cupom');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (cupom: Cupom) => {
    await setCupomStatus(empresaId, cupom.id, !cupom.ativo);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este cupom?')) return;
    await deleteCupom(empresaId, id);
    if (editingId === id) resetForm();
    load();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">{editingId ? 'Editar cupom' : 'Novo cupom'}</h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Cancelar edição
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input
            placeholder="Código (ex: BEMVINDO10)"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
            required
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCupom })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="PERCENTUAL">Percentual (%)</option>
            <option value="VALOR_FIXO">Valor fixo (R$)</option>
            <option value="FRETE_GRATIS">Frete grátis</option>
          </select>
          {form.tipo !== 'FRETE_GRATIS' && (
            <input
              type="number"
              step="0.01"
              placeholder={form.tipo === 'PERCENTUAL' ? 'Percentual (ex: 10)' : 'Valor em R$'}
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          )}
        </div>

        <input
          placeholder="Descrição (opcional)"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />

        <div className="grid md:grid-cols-3 gap-3">
          <input
            type="number"
            step="0.01"
            placeholder="Pedido mínimo (opcional)"
            value={form.valorMinimoPedido}
            onChange={(e) => setForm({ ...form, valorMinimoPedido: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Limite de usos (opcional)"
            value={form.usoMaximo}
            onChange={(e) => setForm({ ...form, usoMaximo: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={form.validoAte}
            onChange={(e) => setForm({ ...form, validoAte: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.apenasPrimeiraCompra}
            onChange={(e) => setForm({ ...form, apenasPrimeiraCompra: e.target.checked })}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">Válido apenas na primeira compra do cliente</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar cupom'}
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {cupons.map((cupom) => (
            <div key={cupom.id} className="flex items-center gap-3 border border-gray-200 rounded-2xl p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <Ticket className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-gray-800 text-sm">{cupom.codigo}</p>
                <p className="text-xs text-gray-400">
                  {TIPO_CUPOM_LABELS[cupom.tipo]}
                  {cupom.valor != null ? ` — ${cupom.tipo === 'PERCENTUAL' ? `${cupom.valor}%` : `R$ ${Number(cupom.valor).toFixed(2)}`}` : ''}
                  {cupom.apenasPrimeiraCompra ? ' · 1ª compra' : ''}
                  {cupom.usoMaximo != null ? ` · ${cupom.usosRealizados}/${cupom.usoMaximo} usos` : ` · ${cupom.usosRealizados} usos`}
                </p>
              </div>
              <button
                onClick={() => handleToggleAtivo(cupom)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                  cupom.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {cupom.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => handleEdit(cupom)} className="text-gray-400 hover:text-gray-700 shrink-0">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(cupom.id)} className="text-red-500 hover:text-red-700 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {cupons.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhum cupom cadastrado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CuponsTab;
