import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, Mail, Phone, FileText, Link2, UserCircle, Lock, Loader2, Eye, EyeOff,
  Layers, Star, Percent, Save, Gift,
} from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { Field, inputClasses } from '../components/superadmin/EmpresaFormFields';
import ToggleSwitch from '../components/superadmin/ToggleSwitch';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { createEmpresa } from '../lib/empresas';
import { fetchPlanos } from '../lib/planos';
import { maskDocumento, maskTelefone, slugify, onlyDigits } from '../lib/masks';
import { EmpresaFormInput } from '../types/Empresa';
import { Plano } from '../types/Plano';
import { ApiError } from '../lib/apiClient';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

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
  planoId: '',
  indicadoPor: '',
};

const SuperAdminNovaEmpresaPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.kind !== 'superadmin') return;
      signOutSuperAdmin();
      navigate('/super-admin', { replace: true });
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [navigate]);

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [form, setForm] = useState<EmpresaFormInput>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [comissaoAvulsaInput, setComissaoAvulsaInput] = useState('10');
  const [comissaoAvulsaError, setComissaoAvulsaError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  useEffect(() => {
    if (authorized) fetchPlanos().then(setPlanos).catch(() => setPlanos([]));
  }, [authorized]);

  const set = <K extends keyof EmpresaFormInput>(key: K, value: EmpresaFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNomeChange = (value: string) => {
    set('nome', value);
    if (!slugTouched) set('slug', slugify(value));
  };

  const validate = useCallback((): boolean => {
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
    if (form.senha.length < 6) errors.senha = 'Mínimo de 6 caracteres';
    setFieldErrors(errors);

    setComissaoAvulsaError('');
    if (!form.planoId) {
      const valor = Number(comissaoAvulsaInput);
      if (Number.isNaN(valor) || valor < 1 || valor > 20) {
        setComissaoAvulsaError('Informe um valor entre 1 e 20');
        return false;
      }
    }

    return Object.keys(errors).length === 0;
  }, [form, comissaoAvulsaInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const criada = await createEmpresa({
        ...form,
        telefone: onlyDigits(form.telefone),
        documento: onlyDigits(form.documento),
        slug: form.slug.toLowerCase(),
        ...(!form.planoId ? { comissaoPercent: Number(comissaoAvulsaInput) } : {}),
      });
      navigate('/super-admin/empresas', {
        state: { feedback: { type: 'success', message: `Empresa "${criada.nome}" cadastrada com sucesso.` } },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao cadastrar empresa');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/super-admin/empresas')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/saltfood-icon.png" alt="SaltFood" className="h-11 w-11" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                <h1 className="text-xl font-bold text-gray-900">Nova Empresa</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { signOutSuperAdmin(); navigate('/super-admin', { replace: true }); }}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Sair
              </button>
              <SuperAdminNav onOpenChange={setNavOpen} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-gray-800">Dados da empresa</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome da empresa" icon={<Building2 className="h-3.5 w-3.5" />} error={fieldErrors.nome}>
                  <input
                    value={form.nome}
                    onChange={(e) => handleNomeChange(e.target.value)}
                    placeholder="Ex: Restaurante Abençoado"
                    className={inputClasses(false, !!fieldErrors.nome)}
                  />
                </Field>
              </div>

              <Field label="CNPJ ou CPF" icon={<FileText className="h-3.5 w-3.5" />} error={fieldErrors.documento}>
                <input
                  value={form.documento}
                  onChange={(e) => set('documento', maskDocumento(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className={inputClasses(false, !!fieldErrors.documento)}
                />
              </Field>

              <Field label="Slug" icon={<Link2 className="h-3.5 w-3.5" />} error={fieldErrors.slug}>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}
                  placeholder="minha-empresa"
                  className={inputClasses(false, !!fieldErrors.slug)}
                />
              </Field>

              <Field label="Indicado por (código, opcional)" icon={<Gift className="h-3.5 w-3.5" />}>
                <input
                  value={form.indicadoPor || ''}
                  onChange={(e) => set('indicadoPor', e.target.value.toUpperCase())}
                  placeholder="Código de outra loja da plataforma"
                  className={inputClasses(false, false)}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-gray-800">Responsável e contato</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nome do responsável" icon={<User className="h-3.5 w-3.5" />} error={fieldErrors.responsavelNome}>
                <input
                  value={form.responsavelNome}
                  onChange={(e) => set('responsavelNome', e.target.value)}
                  placeholder="Nome completo"
                  className={inputClasses(false, !!fieldErrors.responsavelNome)}
                />
              </Field>

              <Field label="Telefone / WhatsApp" icon={<Phone className="h-3.5 w-3.5" />} error={fieldErrors.telefone}>
                <input
                  value={form.telefone}
                  onChange={(e) => set('telefone', maskTelefone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className={inputClasses(false, !!fieldErrors.telefone)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="E-mail" icon={<Mail className="h-3.5 w-3.5" />} error={fieldErrors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="contato@empresa.com"
                    className={inputClasses(false, !!fieldErrors.email)}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-gray-800">Acesso do administrador</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Usuário" icon={<UserCircle className="h-3.5 w-3.5" />} error={fieldErrors.usuario}>
                <input
                  value={form.usuario}
                  onChange={(e) => set('usuario', e.target.value)}
                  placeholder="usuario.login"
                  autoComplete="off"
                  className={inputClasses(false, !!fieldErrors.usuario)}
                />
              </Field>

              <Field label="Senha" icon={<Lock className="h-3.5 w-3.5" />} error={fieldErrors.senha}>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => set('senha', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className={`${inputClasses(false, !!fieldErrors.senha)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </section>

          {planos.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
                <Layers className="h-3.5 w-3.5 text-orange-500" /> Plano de assinatura
              </h3>
              <p className="mb-3 text-xs text-gray-400">
                Atribuído já no cadastro — a comissão da empresa é sincronizada automaticamente com a do plano escolhido.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label
                  className={`flex cursor-pointer flex-col rounded-xl border px-3.5 py-3 transition-colors ${
                    !form.planoId ? 'border-orange-500 bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input type="radio" name="planoId" checked={!form.planoId} onChange={() => set('planoId', '')} />
                    <span className="text-sm font-semibold text-gray-800">Sem plano</span>
                  </div>
                  <span className="mt-1 text-xs text-gray-400">Comissão avulsa sobre as vendas</span>

                  {!form.planoId && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          step={0.5}
                          value={comissaoAvulsaInput}
                          onChange={(e) => setComissaoAvulsaInput(e.target.value)}
                          className="w-20 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                        <Percent className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                      </div>
                      <span className="text-[11px] text-gray-400">(1 a 20%)</span>
                    </div>
                  )}
                  {!form.planoId && comissaoAvulsaError && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">{comissaoAvulsaError}</p>
                  )}
                </label>

                {planos.filter((p) => p.ativo).map((plano) => (
                  <label
                    key={plano.id}
                    className={`relative flex cursor-pointer flex-col rounded-xl border px-3.5 py-3 transition-colors ${
                      form.planoId === plano.id ? 'border-orange-500 bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {plano.destaque && (
                      <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold text-white">
                        <Star className="h-2.5 w-2.5" /> POPULAR
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="planoId"
                        checked={form.planoId === plano.id}
                        onChange={() => set('planoId', plano.id)}
                      />
                      <span className="text-sm font-semibold text-gray-800">{plano.nome}</span>
                    </div>
                    <span className="mt-1 text-xs text-gray-500">
                      R$ {plano.valorMensal.toFixed(2)}/mês{plano.comissaoPercent > 0 ? ` + ${plano.comissaoPercent}%` : ''}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-wrap gap-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
            <ToggleSwitch label="Status da empresa" checked={form.empresaAtiva} onChange={(v) => set('empresaAtiva', v)} />
            <ToggleSwitch label="Status do administrador" checked={form.adminAtivo} onChange={(v) => set('adminAtivo', v)} />
          </section>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/super-admin/empresas')}
              disabled={submitting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting ? 'Cadastrando...' : 'Cadastrar empresa'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default SuperAdminNovaEmpresaPage;
