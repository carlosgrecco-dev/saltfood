import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, KeyRound, ClipboardList, Wallet } from 'lucide-react';
import { Motoboy } from '../../types/Motoboy';
import { fetchMotoboys, createMotoboy, updateMotoboy, setMotoboyStatus, setMotoboyPin, deleteMotoboy } from '../../lib/motoboysApi';
import MotoboyPagamentosTab from './MotoboyPagamentosTab';

interface MotoboysTabProps {
  empresaId: string;
}

type SubTab = 'cadastro' | 'pagamentos';

const MotoboysTab: React.FC<MotoboysTabProps> = ({ empresaId }) => {
  const [subTab, setSubTab] = useState<SubTab>('cadastro');
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [newMotoboy, setNewMotoboy] = useState({ nome: '', telefone: '', taxaPadrao: '7.00' });
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [savingPinFor, setSavingPinFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMotoboys(await fetchMotoboys(empresaId));
    } catch {
      /* silencioso */
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMotoboy.nome) return;
    await createMotoboy(empresaId, {
      nome: newMotoboy.nome,
      telefone: newMotoboy.telefone || undefined,
      taxaPadrao: parseFloat(newMotoboy.taxaPadrao) || 0,
    });
    setNewMotoboy({ nome: '', telefone: '', taxaPadrao: '7.00' });
    load();
  };

  const handleUpdateTaxa = async (motoboy: Motoboy, taxaPadrao: number) => {
    await updateMotoboy(empresaId, motoboy.id, { nome: motoboy.nome, telefone: motoboy.telefone || undefined, taxaPadrao });
    load();
  };

  const handleToggleAtivo = async (motoboy: Motoboy) => {
    await setMotoboyStatus(empresaId, motoboy.id, !motoboy.ativo);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este motoboy?')) return;
    await deleteMotoboy(empresaId, id);
    load();
  };

  const handleSetPin = async (motoboyId: string) => {
    const pin = pinDrafts[motoboyId];
    if (!pin || !/^[0-9]{4,6}$/.test(pin)) {
      alert('Digite um PIN numérico de 4 a 6 dígitos.');
      return;
    }
    setSavingPinFor(motoboyId);
    try {
      await setMotoboyPin(empresaId, motoboyId, pin);
      setPinDrafts((prev) => ({ ...prev, [motoboyId]: '' }));
      alert('PIN definido! Repasse ao motoboy o telefone cadastrado + este PIN para ele acessar /motoboy.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível definir o PIN.');
    } finally {
      setSavingPinFor(null);
    }
  };

  const switcher = (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
      <button
        type="button"
        onClick={() => setSubTab('cadastro')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'cadastro' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <ClipboardList className="h-3.5 w-3.5" /> Cadastro
      </button>
      <button
        type="button"
        onClick={() => setSubTab('pagamentos')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'pagamentos' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <Wallet className="h-3.5 w-3.5" /> Pagamentos
      </button>
    </div>
  );

  if (subTab === 'pagamentos') {
    return (
      <div>
        {switcher}
        <MotoboyPagamentosTab empresaId={empresaId} />
      </div>
    );
  }

  return (
    <div>
      {switcher}
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
        <input
          placeholder="Nome do motoboy"
          value={newMotoboy.nome}
          onChange={(e) => setNewMotoboy({ ...newMotoboy, nome: e.target.value })}
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          placeholder="Telefone"
          value={newMotoboy.telefone}
          onChange={(e) => setNewMotoboy({ ...newMotoboy, telefone: e.target.value })}
          className="flex-1 min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Valor por corrida"
          value={newMotoboy.taxaPadrao}
          onChange={(e) => setNewMotoboy({ ...newMotoboy, taxaPadrao: e.target.value })}
          className="w-40 px-3 py-2 border border-gray-300 rounded-lg"
        />
        <button type="submit" className="flex items-center space-x-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
          <Plus className="h-4 w-4" /> <span>Adicionar</span>
        </button>
      </form>

      <div className="space-y-2">
        {motoboys.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 rounded-xl p-4">
            <div>
              <p className="font-bold text-gray-800">{m.nome}</p>
              <p className="text-sm text-gray-500">{m.telefone || 'sem telefone'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-600">R$</label>
              <input
                type="number"
                step="0.01"
                defaultValue={m.taxaPadrao}
                onBlur={(e) => handleUpdateTaxa(m, parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
              <div className="flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-gray-400" />
                <input
                  placeholder="PIN (4-6 dígitos)"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinDrafts[m.id] || ''}
                  onChange={(e) => setPinDrafts((prev) => ({ ...prev, [m.id]: e.target.value.replace(/\D/g, '') }))}
                  className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => handleSetPin(m.id)}
                  disabled={savingPinFor === m.id}
                  className="text-xs bg-gray-800 hover:bg-gray-900 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                >
                  {savingPinFor === m.id ? '...' : 'Definir PIN'}
                </button>
              </div>
              <button
                onClick={() => handleToggleAtivo(m)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${m.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
              >
                {m.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {motoboys.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum motoboy cadastrado</p>}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Depois de definir o PIN, repasse ao motoboy o telefone cadastrado + o PIN para ele acessar{' '}
        <span className="font-mono">/motoboy</span>.
      </p>
    </div>
  );
};

export default MotoboysTab;
