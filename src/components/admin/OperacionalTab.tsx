import React, { useCallback, useEffect, useState } from 'react';
import { Save, Clock, Timer, Banknote } from 'lucide-react';
import { fetchEmpresaById, updateOperacional } from '../../lib/empresas';
import { fetchHorarios, updateHorarios, HorarioInput } from '../../lib/horarios';

interface OperacionalTabProps {
  empresaId: string;
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const horariosVazios = (): HorarioInput[] => DIAS_SEMANA.map((_, diaSemana) => ({
  diaSemana,
  abre: '08:00',
  fecha: '22:00',
  fechado: false,
}));

const OperacionalTab: React.FC<OperacionalTabProps> = ({ empresaId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [usarHorarioAutomatico, setUsarHorarioAutomatico] = useState(false);
  const [tempoEstimadoMin, setTempoEstimadoMin] = useState('');
  const [tempoEstimadoMax, setTempoEstimadoMax] = useState('');
  const [pedidoMinimo, setPedidoMinimo] = useState('0');
  const [horarios, setHorarios] = useState<HorarioInput[]>(horariosVazios());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empresa, horariosSalvos] = await Promise.all([
        fetchEmpresaById(empresaId),
        fetchHorarios(empresaId),
      ]);
      setUsarHorarioAutomatico(empresa.usarHorarioAutomatico);
      setTempoEstimadoMin(empresa.tempoEstimadoMin != null ? String(empresa.tempoEstimadoMin) : '');
      setTempoEstimadoMax(empresa.tempoEstimadoMax != null ? String(empresa.tempoEstimadoMax) : '');
      setPedidoMinimo(String(empresa.pedidoMinimo ?? 0));

      const base = horariosVazios();
      for (const h of horariosSalvos) {
        base[h.diaSemana] = { diaSemana: h.diaSemana, abre: h.abre || '08:00', fecha: h.fecha || '22:00', fechado: h.fechado };
      }
      setHorarios(base);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const setHorarioDia = (diaSemana: number, patch: Partial<HorarioInput>) => {
    setHorarios((prev) => prev.map((h) => (h.diaSemana === diaSemana ? { ...h, ...patch } : h)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await updateOperacional(empresaId, {
        usarHorarioAutomatico,
        tempoEstimadoMin: tempoEstimadoMin ? Number(tempoEstimadoMin) : null,
        tempoEstimadoMax: tempoEstimadoMax ? Number(tempoEstimadoMax) : null,
        pedidoMinimo: pedidoMinimo ? Number(pedidoMinimo) : 0,
      });
      await updateHorarios(empresaId, horarios);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Timer className="h-4 w-4 text-orange-600" /> Tempo estimado e pedido mínimo
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Tempo mínimo (min)</label>
            <input
              type="number"
              min={0}
              value={tempoEstimadoMin}
              onChange={(e) => setTempoEstimadoMin(e.target.value)}
              placeholder="ex: 40"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Tempo máximo (min)</label>
            <input
              type="number"
              min={0}
              value={tempoEstimadoMax}
              onChange={(e) => setTempoEstimadoMax(e.target.value)}
              placeholder="ex: 60"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Pedido mínimo (R$)</label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min={0}
                step="0.01"
                value={pedidoMinimo}
                onChange={(e) => setPedidoMinimo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" /> Horário de funcionamento
          </h3>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={usarHorarioAutomatico}
              onChange={(e) => setUsarHorarioAutomatico(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            Abrir/fechar automaticamente por horário
          </label>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
          {!usarHorarioAutomatico && (
            <p className="text-xs text-gray-400 mb-2">
              O horário automático está desligado — a loja segue apenas o botão "Loja Aberta/Fechada" no topo do painel.
              Configure os dias abaixo e ative a opção acima para automatizar.
            </p>
          )}
          {horarios.map((h) => (
            <div key={h.diaSemana} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <span className="w-24 text-sm text-gray-700 shrink-0">{DIAS_SEMANA[h.diaSemana]}</span>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                <input
                  type="checkbox"
                  checked={h.fechado}
                  onChange={(e) => setHorarioDia(h.diaSemana, { fechado: e.target.checked })}
                  className="w-3.5 h-3.5 text-orange-600 rounded focus:ring-orange-500"
                />
                Fechado
              </label>
              {!h.fechado && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.abre || ''}
                    onChange={(e) => setHorarioDia(h.diaSemana, { abre: e.target.value })}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-gray-400 text-xs">até</span>
                  <input
                    type="time"
                    value={h.fecha || ''}
                    onChange={(e) => setHorarioDia(h.diaSemana, { fecha: e.target.value })}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">Configurações salvas com sucesso!</div>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  );
};

export default OperacionalTab;
