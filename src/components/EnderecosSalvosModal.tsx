import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star, X } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useTenant } from '../context/TenantContext';
import { useCustomer } from '../context/CustomerContext';
import {
  fetchEnderecos, createEndereco, updateEndereco, setEnderecoPrincipal, deleteEndereco,
} from '../lib/enderecos';
import { EnderecoCliente } from '../types/Endereco';

interface EnderecosSalvosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm = { rotulo: 'Casa', cep: '', endereco: '', numero: '', bairro: '', cidade: '', referencia: '' };

const EnderecosSalvosModal: React.FC<EnderecosSalvosModalProps> = ({ isOpen, onClose }) => {
  const { empresa } = useTenant();
  const { customer } = useCustomer();
  const [enderecos, setEnderecos] = useState<EnderecoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    try {
      setEnderecos(await fetchEnderecos(empresa.id, customer.id));
    } catch {
      setEnderecos([]);
    } finally {
      setLoading(false);
    }
  }, [empresa.id, customer]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (endereco: EnderecoCliente) => {
    setEditingId(endereco.id);
    setForm({
      rotulo: endereco.rotulo,
      cep: endereco.cep || '',
      endereco: endereco.endereco,
      numero: endereco.numero || '',
      bairro: endereco.bairro || '',
      cidade: endereco.cidade || '',
      referencia: endereco.referencia || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setError('');
    if (!form.rotulo || !form.endereco) {
      setError('Informe ao menos o rótulo e o endereço.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateEndereco(empresa.id, customer.id, editingId, form);
      } else {
        await createEndereco(empresa.id, customer.id, form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar endereço');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrincipal = async (id: string) => {
    if (!customer) return;
    await setEnderecoPrincipal(empresa.id, customer.id, id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!customer) return;
    if (!window.confirm('Remover este endereço?')) return;
    await deleteEndereco(empresa.id, customer.id, id);
    load();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Meus Endereços" zIndexClass="z-[60]">
      <div className="p-5 space-y-3">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[var(--cor-primaria)] text-gray-500 hover:text-[var(--cor-primaria)] rounded-2xl py-3 transition-colors"
          >
            <Plus className="h-4 w-4" /> Adicionar endereço
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">{editingId ? 'Editar endereço' : 'Novo endereço'}</p>
              <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.rotulo}
                onChange={(e) => setForm({ ...form, rotulo: e.target.value })}
                placeholder="Rótulo (Casa, Trabalho...)"
                className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                required
              />
              <input
                value={form.cep}
                onChange={(e) => setForm({ ...form, cep: e.target.value })}
                placeholder="CEP"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              />
              <input
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Número"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              />
              <input
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Endereço"
                className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                required
              />
              <input
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                placeholder="Bairro"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              />
              <input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Cidade"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              />
              <input
                value={form.referencia}
                onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                placeholder="Referência (opcional)"
                className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--cor-primaria)] hover:brightness-110 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar endereço'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-400 text-sm py-6">Carregando...</p>
        ) : (
          <div className="space-y-2">
            {enderecos.map((end) => (
              <div key={end.id} className="border border-gray-100 rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-800 text-sm truncate">{end.rotulo}</p>
                        {end.principal && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--cor-primaria)] bg-amber-50 px-1.5 py-0.5 rounded-full">
                            <Star className="h-2.5 w-2.5 fill-current" /> Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {end.endereco}{end.numero ? `, ${end.numero}` : ''}{end.bairro ? ` - ${end.bairro}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEdit(end)} className="text-gray-400 hover:text-gray-700 p-1">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(end.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {!end.principal && (
                  <button
                    onClick={() => handleSetPrincipal(end.id)}
                    className="mt-2 text-xs text-gray-500 hover:text-[var(--cor-primaria)] transition-colors"
                  >
                    Definir como principal
                  </button>
                )}
              </div>
            ))}
            {enderecos.length === 0 && !showForm && (
              <p className="text-center text-gray-400 text-sm py-6">Nenhum endereço salvo ainda.</p>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default EnderecosSalvosModal;
