import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, MapPin, Gift, Save } from 'lucide-react';
import { fetchZonasEntrega, createZonaEntrega, updateZonaEntrega, setZonaEntregaStatus, deleteZonaEntrega } from '../../lib/zonasEntrega';
import { fetchEmpresaById, updateFreteConfig } from '../../lib/empresas';
import { ZonaEntrega, TipoZonaEntrega, TIPO_ZONA_LABELS } from '../../types/ZonaEntrega';

interface ZonasEntregaTabProps {
  empresaId: string;
}

const emptyForm = {
  tipo: 'BAIRRO' as TipoZonaEntrega,
  bairro: '',
  distanciaDeKm: '',
  distanciaAteKm: '',
  taxa: '',
};

const ZonasEntregaTab: React.FC<ZonasEntregaTabProps> = ({ empresaId }) => {
  const [zonas, setZonas] = useState<ZonaEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState('');
  const [savingFrete, setSavingFrete] = useState(false);
  const [freteSuccess, setFreteSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, empresa] = await Promise.all([fetchZonasEntrega(empresaId), fetchEmpresaById(empresaId)]);
      setZonas(lista);
      setFreteGratisAcimaDe(empresa.freteGratisAcimaDe != null ? String(empresa.freteGratisAcimaDe) : '');
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

  const handleEdit = (zona: ZonaEntrega) => {
    setEditingId(zona.id);
    setForm({
      tipo: zona.tipo,
      bairro: zona.bairro || '',
      distanciaDeKm: zona.distanciaDeKm != null ? String(zona.distanciaDeKm) : '',
      distanciaAteKm: zona.distanciaAteKm != null ? String(zona.distanciaAteKm) : '',
      taxa: String(zona.taxa),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.taxa === '' || Number(form.taxa) < 0) {
      setError('Informe uma taxa válida (maior ou igual a zero).');
      return;
    }
    if (form.tipo === 'BAIRRO' && !form.bairro) {
      setError('Informe o nome do bairro.');
      return;
    }
    if (form.tipo !== 'BAIRRO' && (!form.distanciaDeKm || !form.distanciaAteKm)) {
      setError('Informe a faixa de distância (de/até em km).');
      return;
    }

    const payload = {
      tipo: form.tipo,
      bairro: form.tipo === 'BAIRRO' ? form.bairro : undefined,
      distanciaDeKm: form.tipo !== 'BAIRRO' ? Number(form.distanciaDeKm) : undefined,
      distanciaAteKm: form.tipo !== 'BAIRRO' ? Number(form.distanciaAteKm) : undefined,
      taxa: Number(form.taxa),
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateZonaEntrega(empresaId, editingId, payload);
      } else {
        await createZonaEntrega(empresaId, payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar zona de entrega');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (zona: ZonaEntrega) => {
    await setZonaEntregaStatus(empresaId, zona.id, !zona.ativo);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover esta zona de entrega?')) return;
    await deleteZonaEntrega(empresaId, id);
    if (editingId === id) resetForm();
    load();
  };

  const handleSalvarFreteGratis = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFrete(true);
    setFreteSuccess(false);
    try {
      await updateFreteConfig(empresaId, freteGratisAcimaDe ? Number(freteGratisAcimaDe) : null);
      setFreteSuccess(true);
    } finally {
      setSavingFrete(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-orange-600" /> Frete grátis
        </h3>
        <form onSubmit={handleSalvarFreteGratis} className="bg-gray-50 p-4 rounded-xl flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Frete grátis para pedidos acima de (R$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={freteGratisAcimaDe}
              onChange={(e) => setFreteGratisAcimaDe(e.target.value)}
              placeholder="Deixe em branco para desativar"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
            />
          </div>
          <button
            type="submit"
            disabled={savingFrete}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {savingFrete ? 'Salvando...' : 'Salvar'}
          </button>
          {freteSuccess && <span className="text-xs text-green-700">Salvo!</span>}
        </form>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-600" /> Taxas de entrega por zona
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          No checkout, o bairro informado pelo cliente é comparado com as zonas do tipo "Por bairro" ativas; sem
          correspondência, usa-se a taxa fixa padrão da loja. Zonas por raio/faixa de distância ficam registradas
          para referência futura (exigem localização geocodificada, ainda não integrada).
        </p>

        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">{editingId ? 'Editar zona' : 'Nova zona'}</p>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoZonaEntrega })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {(Object.keys(TIPO_ZONA_LABELS) as TipoZonaEntrega[]).map((tipo) => (
                <option key={tipo} value={tipo}>{TIPO_ZONA_LABELS[tipo]}</option>
              ))}
            </select>

            {form.tipo === 'BAIRRO' ? (
              <input
                placeholder="Nome do bairro"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:col-span-1"
              />
            ) : (
              <>
                <input
                  type="number"
                  step="0.1"
                  placeholder="De (km)"
                  value={form.distanciaDeKm}
                  onChange={(e) => setForm({ ...form, distanciaDeKm: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </>
            )}

            <input
              type="number"
              step="0.01"
              placeholder="Taxa (R$)"
              value={form.taxa}
              onChange={(e) => setForm({ ...form, taxa: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {form.tipo !== 'BAIRRO' && (
            <input
              type="number"
              step="0.1"
              placeholder="Até (km)"
              value={form.distanciaAteKm}
              onChange={(e) => setForm({ ...form, distanciaAteKm: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:w-48"
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar zona'}
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Carregando...</p>
        ) : (
          <div className="space-y-2">
            {zonas.map((zona) => (
              <div key={zona.id} className="flex items-center gap-3 border border-gray-200 rounded-2xl p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <MapPin className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">
                    {zona.tipo === 'BAIRRO' ? zona.bairro : `${zona.distanciaDeKm}–${zona.distanciaAteKm} km`}
                  </p>
                  <p className="text-xs text-gray-400">{TIPO_ZONA_LABELS[zona.tipo]} · R$ {Number(zona.taxa).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handleToggleAtivo(zona)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                    zona.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {zona.ativo ? 'Ativa' : 'Inativa'}
                </button>
                <button onClick={() => handleEdit(zona)} className="text-gray-400 hover:text-gray-700 shrink-0">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(zona.id)} className="text-red-500 hover:text-red-700 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {zonas.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhuma zona cadastrada — o pedido usará a taxa fixa padrão da loja.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ZonasEntregaTab;
