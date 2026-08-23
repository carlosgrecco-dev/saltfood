import React, { useEffect, useState } from 'react';
import {
  X, Building2, User, Mail, Phone, FileText, Link2, UserCircle, Lock, Loader2, Pencil, Percent, Save, Gift, Coins, Sparkles,
} from 'lucide-react';
import { Empresa, EmpresaFormInput } from '../../types/Empresa';
import { maskDocumento, maskTelefone, onlyDigits } from '../../lib/masks';
import { Field, inputClasses } from './EmpresaFormFields';
import ToggleSwitch from './ToggleSwitch';
import { FUNCOES, CampoFuncionalidade } from '../../data/funcionalidades';

export type EmpresaModalMode = 'edit' | 'view';

interface EmpresaFormModalProps {
  isOpen: boolean;
  mode: EmpresaModalMode;
  empresa: Empresa | null;
  submitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (data: EmpresaFormInput) => void;
  onRequestEdit?: () => void;
  onSaveComissao?: (percent: number) => Promise<void>;
  onSaveComissaoVisibilidade?: (ocultar: boolean) => Promise<void>;
  onSaveSaltfoodCoins?: (participa: boolean, percent: number | null) => Promise<void>;
  onSaveFuncionalidades?: (input: Record<CampoFuncionalidade, boolean>) => Promise<void>;
  onSaveEmpresaAtiva?: (ativo: boolean) => Promise<void>;
  onSaveAdminAtivo?: (ativo: boolean) => Promise<void>;
}

const emptyForm: EmpresaFormInput = {
  nome: '',
  responsavelNome: '',
  email: '',
  telefone: '',
  documento: '',
  slug: '',
  usuario: '',
  senha: '',
  empresaAtiva: true,
  adminAtivo: true,
};

const EmpresaFormModal: React.FC<EmpresaFormModalProps> = ({
  isOpen, mode, empresa, submitting = false, errorMessage, onClose, onSubmit, onRequestEdit, onSaveComissao,
  onSaveComissaoVisibilidade, onSaveSaltfoodCoins, onSaveFuncionalidades, onSaveEmpresaAtiva, onSaveAdminAtivo,
}) => {
  const [form, setForm] = useState<EmpresaFormInput>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [comissaoInput, setComissaoInput] = useState('10');
  const [savingComissao, setSavingComissao] = useState(false);
  const [comissaoError, setComissaoError] = useState('');
  const [savingVisibilidade, setSavingVisibilidade] = useState(false);
  const [visibilidadeError, setVisibilidadeError] = useState('');
  const [saltfoodCoinsAtivo, setSaltfoodCoinsAtivo] = useState(false);
  const [saltfoodCoinsPercentInput, setSaltfoodCoinsPercentInput] = useState('');
  const [savingSaltfoodCoins, setSavingSaltfoodCoins] = useState(false);
  const [saltfoodCoinsError, setSaltfoodCoinsError] = useState('');
  const [funcionalidadesForm, setFuncionalidadesForm] = useState<Record<CampoFuncionalidade, boolean>>(
    () => Object.fromEntries(FUNCOES.map((f) => [f.campo, false])) as Record<CampoFuncionalidade, boolean>
  );
  const [savingFuncionalidades, setSavingFuncionalidades] = useState(false);
  const [funcionalidadesError, setFuncionalidadesError] = useState('');
  const [savingEmpresaAtiva, setSavingEmpresaAtiva] = useState(false);
  const [savingAdminAtivo, setSavingAdminAtivo] = useState(false);
  const [statusError, setStatusError] = useState('');

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!isOpen) return;

    if (empresa) {
      setForm({
        nome: empresa.nome,
        responsavelNome: empresa.responsavelNome,
        email: empresa.email,
        telefone: maskTelefone(empresa.telefone),
        documento: maskDocumento(empresa.documento),
        slug: empresa.slug,
        usuario: empresa.usuario,
        senha: '',
        empresaAtiva: empresa.empresaAtiva,
        adminAtivo: empresa.adminAtivo,
      });
    } else {
      setForm(emptyForm);
    }
    setFieldErrors({});
    setComissaoInput(String(empresa?.comissaoPercent ?? 10));
    setComissaoError('');
    setSaltfoodCoinsAtivo(empresa?.participaSaltfoodCoins ?? false);
    setSaltfoodCoinsPercentInput(empresa?.saltfoodCoinsPercent != null ? String(empresa.saltfoodCoinsPercent) : '');
    setSaltfoodCoinsError('');
    setFuncionalidadesForm(
      Object.fromEntries(FUNCOES.map((f) => [f.campo, empresa ? empresa[f.campo] : false])) as Record<CampoFuncionalidade, boolean>
    );
    setFuncionalidadesError('');
    setStatusError('');
  }, [isOpen, empresa]);

  if (!isOpen) return null;

  const set = <K extends keyof EmpresaFormInput>(key: K, value: EmpresaFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = 'Informe o nome da empresa';
    if (!form.responsavelNome.trim()) errors.responsavelNome = 'Informe o nome do responsável';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'E-mail inválido';
    const telDigits = onlyDigits(form.telefone);
    if (telDigits.length < 10) errors.telefone = 'Telefone incompleto';
    const docDigits = onlyDigits(form.documento);
    if (docDigits.length !== 11 && docDigits.length !== 14) errors.documento = 'CNPJ ou CPF inválido';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) errors.slug = 'Use apenas letras minúsculas, números e hífens';
    if (!form.usuario.trim()) errors.usuario = 'Informe o usuário';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;
    onSubmit({
      ...form,
      telefone: onlyDigits(form.telefone),
      documento: onlyDigits(form.documento),
      slug: form.slug.toLowerCase(),
    });
  };

  const handleSaveComissao = async () => {
    const valor = parseFloat(comissaoInput);
    if (Number.isNaN(valor) || valor < 0 || valor > 30) {
      setComissaoError('Informe um valor entre 0 e 30');
      return;
    }
    if (!onSaveComissao) return;
    setComissaoError('');
    setSavingComissao(true);
    try {
      await onSaveComissao(valor);
    } catch (err) {
      setComissaoError(err instanceof Error ? err.message : 'Erro ao salvar comissão');
    } finally {
      setSavingComissao(false);
    }
  };

  const handleToggleVisibilidade = async (ocultar: boolean) => {
    if (!onSaveComissaoVisibilidade) return;
    setVisibilidadeError('');
    setSavingVisibilidade(true);
    try {
      await onSaveComissaoVisibilidade(ocultar);
    } catch (err) {
      setVisibilidadeError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSavingVisibilidade(false);
    }
  };

  const handleSaveSaltfoodCoins = async () => {
    let percentValor: number | null = null;
    if (saltfoodCoinsPercentInput) {
      percentValor = parseFloat(saltfoodCoinsPercentInput);
      if (Number.isNaN(percentValor) || percentValor < 0 || percentValor > 100) {
        setSaltfoodCoinsError('Informe um valor entre 0 e 100');
        return;
      }
    }
    if (!onSaveSaltfoodCoins) return;
    setSaltfoodCoinsError('');
    setSavingSaltfoodCoins(true);
    try {
      await onSaveSaltfoodCoins(saltfoodCoinsAtivo, percentValor);
    } catch (err) {
      setSaltfoodCoinsError(err instanceof Error ? err.message : 'Erro ao salvar SaltFood Coins');
    } finally {
      setSavingSaltfoodCoins(false);
    }
  };

  const handleSaveFuncionalidades = async () => {
    if (!onSaveFuncionalidades) return;
    setFuncionalidadesError('');
    setSavingFuncionalidades(true);
    try {
      await onSaveFuncionalidades(funcionalidadesForm);
    } catch (err) {
      setFuncionalidadesError(err instanceof Error ? err.message : 'Erro ao salvar funcionalidades');
    } finally {
      setSavingFuncionalidades(false);
    }
  };

  const handleToggleEmpresaAtiva = async (ativo: boolean) => {
    set('empresaAtiva', ativo);
    if (!empresa || !onSaveEmpresaAtiva) return;
    setStatusError('');
    setSavingEmpresaAtiva(true);
    try {
      await onSaveEmpresaAtiva(ativo);
    } catch (err) {
      set('empresaAtiva', !ativo);
      setStatusError(err instanceof Error ? err.message : 'Erro ao salvar status da empresa');
    } finally {
      setSavingEmpresaAtiva(false);
    }
  };

  const handleToggleAdminAtivo = async (ativo: boolean) => {
    set('adminAtivo', ativo);
    if (!empresa || !onSaveAdminAtivo) return;
    setStatusError('');
    setSavingAdminAtivo(true);
    try {
      await onSaveAdminAtivo(ativo);
    } catch (err) {
      set('adminAtivo', !ativo);
      setStatusError(err instanceof Error ? err.message : 'Erro ao salvar status do administrador');
    } finally {
      setSavingAdminAtivo(false);
    }
  };

  const title = mode === 'edit' ? 'Editar empresa' : 'Dados da empresa';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex w-full max-h-[94vh] flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:max-w-2xl sm:rounded-3xl sm:animate-scale-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Building2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              {empresa && <p className="text-xs text-gray-400">/{empresa.slug}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'view' && onRequestEdit && (
              <button
                onClick={onRequestEdit}
                className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-500 hover:bg-orange-100 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full bg-gray-100 p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-6 px-6 py-5">
            <section>
              <h3 className="mb-3 text-sm font-bold text-gray-800">Dados da empresa</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Nome da empresa" icon={<Building2 className="h-3.5 w-3.5" />} error={fieldErrors.nome}>
                    <input
                      value={form.nome}
                      onChange={(e) => set('nome', e.target.value)}
                      readOnly={readOnly}
                      placeholder="Ex: Restaurante Abençoado"
                      className={inputClasses(readOnly, !!fieldErrors.nome)}
                    />
                  </Field>
                </div>

                <Field label="CNPJ ou CPF" icon={<FileText className="h-3.5 w-3.5" />} error={fieldErrors.documento}>
                  <input
                    value={form.documento}
                    onChange={(e) => set('documento', maskDocumento(e.target.value))}
                    readOnly={readOnly}
                    placeholder="00.000.000/0000-00"
                    className={inputClasses(readOnly, !!fieldErrors.documento)}
                  />
                </Field>

                <Field label="Slug" icon={<Link2 className="h-3.5 w-3.5" />} error={fieldErrors.slug}>
                  <input
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value.toLowerCase())}
                    readOnly={readOnly}
                    placeholder="minha-empresa"
                    className={inputClasses(readOnly, !!fieldErrors.slug)}
                  />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold text-gray-800">Responsável e contato</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nome do responsável" icon={<User className="h-3.5 w-3.5" />} error={fieldErrors.responsavelNome}>
                  <input
                    value={form.responsavelNome}
                    onChange={(e) => set('responsavelNome', e.target.value)}
                    readOnly={readOnly}
                    placeholder="Nome completo"
                    className={inputClasses(readOnly, !!fieldErrors.responsavelNome)}
                  />
                </Field>

                <Field label="Telefone / WhatsApp" icon={<Phone className="h-3.5 w-3.5" />} error={fieldErrors.telefone}>
                  <input
                    value={form.telefone}
                    onChange={(e) => set('telefone', maskTelefone(e.target.value))}
                    readOnly={readOnly}
                    placeholder="(00) 00000-0000"
                    className={inputClasses(readOnly, !!fieldErrors.telefone)}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="E-mail" icon={<Mail className="h-3.5 w-3.5" />} error={fieldErrors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      readOnly={readOnly}
                      placeholder="contato@empresa.com"
                      className={inputClasses(readOnly, !!fieldErrors.email)}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold text-gray-800">Acesso do administrador</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Usuário" icon={<UserCircle className="h-3.5 w-3.5" />} error={fieldErrors.usuario}>
                  <input
                    value={form.usuario}
                    onChange={(e) => set('usuario', e.target.value)}
                    readOnly={readOnly}
                    placeholder="usuario.login"
                    autoComplete="off"
                    className={inputClasses(readOnly, !!fieldErrors.usuario)}
                  />
                </Field>

                <Field label="Senha" icon={<Lock className="h-3.5 w-3.5" />}>
                  <div className={inputClasses(true, false)}>
                    ••••••••&nbsp;
                    <span className="text-xs text-gray-400">(use "Redefinir senha" na listagem)</span>
                  </div>
                </Field>
              </div>
            </section>

            <section className="rounded-2xl bg-gray-50 px-4 py-4">
              <div className="flex flex-wrap items-center gap-6">
                <ToggleSwitch
                  label="Status da empresa"
                  checked={form.empresaAtiva}
                  onChange={handleToggleEmpresaAtiva}
                  disabled={readOnly || savingEmpresaAtiva}
                />
                <ToggleSwitch
                  label="Status do administrador"
                  checked={form.adminAtivo}
                  onChange={handleToggleAdminAtivo}
                  disabled={readOnly || savingAdminAtivo}
                />
                {(savingEmpresaAtiva || savingAdminAtivo) && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
              </div>
              {empresa && <p className="mt-1.5 text-xs text-gray-400">Salva na hora, assim que você troca — não precisa do botão "Salvar alterações" lá embaixo.</p>}
              {statusError && <p className="mt-1.5 text-xs font-medium text-red-600">{statusError}</p>}
            </section>

            {empresa && (
              <section className="rounded-2xl border border-gray-100 px-4 py-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  <Percent className="h-3.5 w-3.5 text-orange-500" /> Comissão da plataforma
                </h3>
                <p className="mb-3 text-xs text-gray-400">
                  Percentual sobre as vendas entregues desta empresa, destinado ao dono da plataforma (0 a 30%).
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      value={comissaoInput}
                      onChange={(e) => setComissaoInput(e.target.value)}
                      className="w-32 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveComissao}
                    disabled={savingComissao}
                    className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
                  >
                    {savingComissao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </button>
                  {comissaoError && <p className="text-xs font-medium text-red-600">{comissaoError}</p>}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <ToggleSwitch
                    label="Ocultar comissão do lojista"
                    checked={empresa.ocultarComissaoTenant}
                    onChange={handleToggleVisibilidade}
                    disabled={savingVisibilidade || !onSaveComissaoVisibilidade}
                    activeLabel="Oculta"
                    inactiveLabel="Visível"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Quando oculta, o card "Comissão da plataforma" some do CRM que o lojista vê.
                  </p>
                  {visibilidadeError && <p className="mt-1 text-xs font-medium text-red-600">{visibilidadeError}</p>}
                </div>
              </section>
            )}

            {empresa && (
              <section className="rounded-2xl border border-gray-100 px-4 py-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  <Coins className="h-3.5 w-3.5 text-amber-600" /> SaltFood Coins
                </h3>
                <p className="mb-3 text-xs text-gray-400">
                  Carteira de fidelidade compartilhada entre lojas da plataforma — diferente do cashback local
                  (que o próprio lojista configura), esta é uma decisão do Super Admin, já que envolve exposição
                  financeira entre lojas diferentes.
                </p>
                <ToggleSwitch
                  label="Participa do SaltFood Coins"
                  checked={saltfoodCoinsAtivo}
                  onChange={setSaltfoodCoinsAtivo}
                  activeLabel="Participa"
                  inactiveLabel="Não participa"
                />
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">% do subtotal, sobre a entrega</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={saltfoodCoinsPercentInput}
                      onChange={(e) => setSaltfoodCoinsPercentInput(e.target.value)}
                      className="w-32 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSaltfoodCoins}
                    disabled={savingSaltfoodCoins}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                  >
                    {savingSaltfoodCoins ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </button>
                  {saltfoodCoinsError && <p className="text-xs font-medium text-red-600">{saltfoodCoinsError}</p>}
                </div>
              </section>
            )}

            {empresa && (
              <section className="rounded-2xl border border-gray-100 px-4 py-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Funcionalidades
                </h3>
                <p className="mb-3 text-xs text-gray-400">
                  Definidas pelo pacote do plano da loja (aba Planos) — aqui dá pra abrir uma exceção pontual sem
                  trocar o plano dela. Atenção: reatribuir o plano depois sobrescreve essa exceção de volta ao
                  pacote padrão.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FUNCOES.map(({ campo, titulo, icon: Icon }) => (
                    <label
                      key={campo}
                      className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-2 cursor-pointer text-xs transition-colors ${
                        funcionalidadesForm[campo] ? 'border-orange-300 bg-orange-50/60 text-orange-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={funcionalidadesForm[campo]}
                        onChange={(e) => setFuncionalidadesForm({ ...funcionalidadesForm, [campo]: e.target.checked })}
                        className="w-3.5 h-3.5 text-orange-500 rounded focus:ring-orange-500"
                      />
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{titulo}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveFuncionalidades}
                    disabled={savingFuncionalidades}
                    className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
                  >
                    {savingFuncionalidades ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </button>
                  {funcionalidadesError && <p className="text-xs font-medium text-red-600">{funcionalidadesError}</p>}
                </div>
              </section>
            )}

            {empresa && (
              <section className="rounded-2xl border border-gray-100 px-4 py-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                  <Gift className="h-3.5 w-3.5 text-orange-500" /> Indicação entre lojas
                </h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Código próprio</p>
                    <p className="font-mono font-semibold text-gray-800">{empresa.codigoIndicacao || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Indicada por</p>
                    <p className="font-semibold text-gray-800">{empresa.indicadaPor ? empresa.indicadaPor.nome : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Crédito acumulado</p>
                    <p className="font-semibold text-emerald-700">R$ {Number(empresa.creditoIndicacaoEmpresa || 0).toFixed(2)}</p>
                  </div>
                </div>
              </section>
            )}

            {errorMessage && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}
          </div>

          {!readOnly && (
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar alterações
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EmpresaFormModal;
