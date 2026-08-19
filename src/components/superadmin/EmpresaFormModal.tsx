import React, { useEffect, useState } from 'react';
import {
  X, Building2, User, Mail, Phone, FileText, Link2, UserCircle, Lock, Loader2, Pencil, Percent, Save, Gift,
} from 'lucide-react';
import { Empresa, EmpresaFormInput } from '../../types/Empresa';
import { maskDocumento, maskTelefone, onlyDigits } from '../../lib/masks';
import { Field, inputClasses } from './EmpresaFormFields';
import ToggleSwitch from './ToggleSwitch';

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
  onSaveComissaoVisibilidade,
}) => {
  const [form, setForm] = useState<EmpresaFormInput>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [comissaoInput, setComissaoInput] = useState('10');
  const [savingComissao, setSavingComissao] = useState(false);
  const [comissaoError, setComissaoError] = useState('');
  const [savingVisibilidade, setSavingVisibilidade] = useState(false);
  const [visibilidadeError, setVisibilidadeError] = useState('');

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
    if (Number.isNaN(valor) || valor < 5 || valor > 20) {
      setComissaoError('Informe um valor entre 5 e 20');
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

  const title = mode === 'edit' ? 'Editar empresa' : 'Dados da empresa';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex w-full max-h-[94vh] flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:max-w-2xl sm:rounded-3xl sm:animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              {empresa && <p className="text-xs text-slate-400">/{empresa.slug}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'view' && onRequestEdit && (
              <button
                onClick={onRequestEdit}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-6 px-6 py-5">
            <section>
              <h3 className="mb-3 text-sm font-bold text-slate-800">Dados da empresa</h3>
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
              <h3 className="mb-3 text-sm font-bold text-slate-800">Responsável e contato</h3>
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
              <h3 className="mb-3 text-sm font-bold text-slate-800">Acesso do administrador</h3>
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
                    <span className="text-xs text-slate-400">(use "Redefinir senha" na listagem)</span>
                  </div>
                </Field>
              </div>
            </section>

            <section className="flex flex-wrap gap-6 rounded-2xl bg-slate-50 px-4 py-4">
              <ToggleSwitch
                label="Status da empresa"
                checked={form.empresaAtiva}
                onChange={(v) => set('empresaAtiva', v)}
                disabled={readOnly}
              />
              <ToggleSwitch
                label="Status do administrador"
                checked={form.adminAtivo}
                onChange={(v) => set('adminAtivo', v)}
                disabled={readOnly}
              />
            </section>

            {empresa && (
              <section className="rounded-2xl border border-slate-100 px-4 py-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Percent className="h-3.5 w-3.5 text-indigo-600" /> Comissão da plataforma
                </h3>
                <p className="mb-3 text-xs text-slate-400">
                  Percentual sobre as vendas entregues desta empresa, destinado ao dono da plataforma (5 a 20%).
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <input
                      type="number"
                      min={5}
                      max={20}
                      step={0.5}
                      value={comissaoInput}
                      onChange={(e) => setComissaoInput(e.target.value)}
                      className="w-32 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveComissao}
                    disabled={savingComissao}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    {savingComissao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </button>
                  {comissaoError && <p className="text-xs font-medium text-red-600">{comissaoError}</p>}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <ToggleSwitch
                    label="Ocultar comissão do lojista"
                    checked={empresa.ocultarComissaoTenant}
                    onChange={handleToggleVisibilidade}
                    disabled={savingVisibilidade || !onSaveComissaoVisibilidade}
                    activeLabel="Oculta"
                    inactiveLabel="Visível"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Quando oculta, o card "Comissão da plataforma" some do CRM que o lojista vê.
                  </p>
                  {visibilidadeError && <p className="mt-1 text-xs font-medium text-red-600">{visibilidadeError}</p>}
                </div>
              </section>
            )}

            {empresa && (
              <section className="rounded-2xl border border-slate-100 px-4 py-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Gift className="h-3.5 w-3.5 text-indigo-600" /> Indicação entre lojas
                </h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Código próprio</p>
                    <p className="font-mono font-semibold text-slate-800">{empresa.codigoIndicacao || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Indicada por</p>
                    <p className="font-semibold text-slate-800">{empresa.indicadaPor ? empresa.indicadaPor.nome : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Crédito acumulado</p>
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
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
