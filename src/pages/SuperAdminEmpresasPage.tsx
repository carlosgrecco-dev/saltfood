import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Plus, Search, Eye, Pencil, Trash2, KeyRound, Phone, Mail, Loader2, Inbox, LogOut,
} from 'lucide-react';
import EmpresaFormModal, { EmpresaModalMode } from '../components/superadmin/EmpresaFormModal';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import ConfirmDialog from '../components/superadmin/ConfirmDialog';
import ResetSenhaDialog from '../components/superadmin/ResetSenhaDialog';
import ToggleSwitch from '../components/superadmin/ToggleSwitch';
import { Empresa, EmpresaFormInput } from '../types/Empresa';
import {
  fetchEmpresas, updateEmpresa, deleteEmpresa, setEmpresaStatus, setAdminStatus, resetEmpresaSenha,
  setComissaoEmpresa, setComissaoVisibilidade,
} from '../lib/empresas';
import { maskDocumento, maskTelefone, documentoLabel } from '../lib/masks';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

type Feedback = { type: 'success' | 'error'; message: string } | null;

const SuperAdminEmpresasPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<EmpresaModalMode>('view');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [empresaForSenha, setEmpresaForSenha] = useState<Empresa | null>(null);
  const [resettingSenha, setResettingSenha] = useState(false);
  const [resetSenhaError, setResetSenhaError] = useState('');

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(true);

  const loadEmpresas = useCallback(async (q?: string) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchEmpresas(q);
      setEmpresas(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) {
      navigate('/super-admin', { replace: true });
    }
  }, [authorized, navigate]);

  useEffect(() => {
    if (authorized) loadEmpresas();
  }, [loadEmpresas, authorized]);

  useEffect(() => {
    const state = location.state as { feedback?: Feedback } | null;
    if (state?.feedback) {
      setFeedback(state.feedback);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    signOutSuperAdmin();
    navigate('/super-admin', { replace: true });
  };

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.kind === 'superadmin') handleLogout();
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const timer = setTimeout(() => {
      loadEmpresas(search.trim() || undefined);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, authorized]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const openViewModal = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setModalMode('view');
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setModalMode('edit');
    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (data: EmpresaFormInput) => {
    if (!selectedEmpresa) return;
    setSubmitting(true);
    setModalError('');
    try {
      const updated = await updateEmpresa(selectedEmpresa.id, data);
      setEmpresas((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setFeedback({ type: 'success', message: `Empresa "${updated.nome}" atualizada com sucesso.` });
      setModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Erro ao salvar empresa');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmpresaStatus = async (empresa: Empresa) => {
    setStatusUpdatingId(empresa.id);
    try {
      const updated = await setEmpresaStatus(empresa.id, !empresa.empresaAtiva);
      setEmpresas((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao atualizar status' });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const toggleAdminStatus = async (empresa: Empresa) => {
    setStatusUpdatingId(empresa.id);
    try {
      const updated = await setAdminStatus(empresa.id, !empresa.adminAtivo);
      setEmpresas((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao atualizar status' });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!empresaToDelete) return;
    setDeleting(true);
    try {
      await deleteEmpresa(empresaToDelete.id);
      setEmpresas((prev) => prev.filter((e) => e.id !== empresaToDelete.id));
      setFeedback({ type: 'success', message: `Empresa "${empresaToDelete.nome}" removida.` });
      setEmpresaToDelete(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao excluir empresa' });
    } finally {
      setDeleting(false);
    }
  };

  const confirmResetSenha = async (senha: string) => {
    if (!empresaForSenha) return;
    setResettingSenha(true);
    setResetSenhaError('');
    try {
      await resetEmpresaSenha(empresaForSenha.id, senha);
      setFeedback({ type: 'success', message: `Senha de "${empresaForSenha.nome}" redefinida com sucesso.` });
      setEmpresaForSenha(null);
    } catch (err) {
      setResetSenhaError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setResettingSenha(false);
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Empurra o conteúdo (reduz a largura útil) quando o menu está expandido; volta ao normal quando retraído. */}
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-black p-1.5">
                <img src="/saltfood.png" alt="SaltFood" className="h-full w-full rounded-md" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                <h1 className="text-xl font-bold text-gray-900">Cadastro de Empresas</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/super-admin/empresas/nova')}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                Nova Empresa
              </button>
              <button
                onClick={handleLogout}
                title="Sair"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <SuperAdminNav onOpenChange={setNavOpen} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {feedback && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="mb-5 relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ/CPF, e-mail ou slug"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <p className="mt-3 text-sm text-gray-500">Carregando empresas...</p>
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm font-medium text-red-700">{loadError}</p>
            <button
              onClick={() => loadEmpresas(search.trim() || undefined)}
              className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : empresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <Inbox className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              {search ? 'Nenhuma empresa encontrada para essa busca.' : 'Nenhuma empresa cadastrada ainda.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/super-admin/empresas/nova')}
                className="mt-4 flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Cadastrar primeira empresa
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: tabela */}
            <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Empresa</th>
                    <th className="px-5 py-3">Contato</th>
                    <th className="px-5 py-3">Documento</th>
                    <th className="px-5 py-3">Slug</th>
                    <th className="px-5 py-3">Empresa</th>
                    <th className="px-5 py-3">Admin</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empresas.map((empresa) => (
                    <tr
                      key={empresa.id}
                      onClick={() => openViewModal(empresa)}
                      title="Ver detalhes"
                      className="cursor-pointer hover:bg-orange-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{empresa.nome}</p>
                        <p className="text-xs text-gray-400">{empresa.responsavelNome}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5 text-gray-600"><Mail className="h-3.5 w-3.5 text-gray-400" />{empresa.email}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400"><Phone className="h-3 w-3" />{maskTelefone(empresa.telefone)}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        <p>{maskDocumento(empresa.documento)}</p>
                        <p className="text-xs text-gray-400">{documentoLabel(empresa.documento)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">/{empresa.slug}</span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <ToggleSwitch
                          size="sm"
                          checked={empresa.empresaAtiva}
                          disabled={statusUpdatingId === empresa.id}
                          onChange={() => toggleEmpresaStatus(empresa)}
                        />
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <ToggleSwitch
                          size="sm"
                          checked={empresa.adminAtivo}
                          disabled={statusUpdatingId === empresa.id}
                          onChange={() => toggleAdminStatus(empresa)}
                        />
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton title="Visualizar" onClick={() => openViewModal(empresa)}>
                            <Eye className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton title="Editar" onClick={() => openEditModal(empresa)}>
                            <Pencil className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton title="Redefinir senha" onClick={() => { setResetSenhaError(''); setEmpresaForSenha(empresa); }}>
                            <KeyRound className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton title="Excluir" tone="danger" onClick={() => setEmpresaToDelete(empresa)}>
                            <Trash2 className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/tablet: cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
              {empresas.map((empresa) => (
                <div
                  key={empresa.id}
                  onClick={() => openViewModal(empresa)}
                  className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                        <Building2 className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{empresa.nome}</p>
                        <p className="truncate text-xs text-gray-400">{empresa.responsavelNome}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">/{empresa.slug}</span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" /><span className="truncate">{empresa.email}</span></p>
                    <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />{maskTelefone(empresa.telefone)}</p>
                    <p className="text-xs text-gray-400">{documentoLabel(empresa.documento)}: {maskDocumento(empresa.documento)}</p>
                  </div>

                  <div
                    className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ToggleSwitch
                      size="sm"
                      label="Empresa"
                      checked={empresa.empresaAtiva}
                      disabled={statusUpdatingId === empresa.id}
                      onChange={() => toggleEmpresaStatus(empresa)}
                    />
                    <ToggleSwitch
                      size="sm"
                      label="Admin"
                      checked={empresa.adminAtivo}
                      disabled={statusUpdatingId === empresa.id}
                      onChange={() => toggleAdminStatus(empresa)}
                    />
                  </div>

                  <div
                    className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ActionButton title="Visualizar" onClick={() => openViewModal(empresa)}>
                      <Eye className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton title="Editar" onClick={() => openEditModal(empresa)}>
                      <Pencil className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton title="Redefinir senha" onClick={() => { setResetSenhaError(''); setEmpresaForSenha(empresa); }}>
                      <KeyRound className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton title="Excluir" tone="danger" onClick={() => setEmpresaToDelete(empresa)}>
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </div>

      <EmpresaFormModal
        isOpen={modalOpen}
        mode={modalMode}
        empresa={selectedEmpresa}
        submitting={submitting}
        errorMessage={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onRequestEdit={() => setModalMode('edit')}
        onSaveComissao={async (percent) => {
          if (!selectedEmpresa) return;
          const atualizado = await setComissaoEmpresa(selectedEmpresa.id, percent);
          setSelectedEmpresa(atualizado);
          setEmpresas((prev) => prev.map((e) => (e.id === atualizado.id ? atualizado : e)));
          setFeedback({ type: 'success', message: `Comissão de "${atualizado.nome}" atualizada para ${percent}%.` });
        }}
        onSaveComissaoVisibilidade={async (ocultar) => {
          if (!selectedEmpresa) return;
          const atualizado = await setComissaoVisibilidade(selectedEmpresa.id, ocultar);
          setSelectedEmpresa(atualizado);
          setEmpresas((prev) => prev.map((e) => (e.id === atualizado.id ? atualizado : e)));
          setFeedback({
            type: 'success',
            message: `Comissão da plataforma ${ocultar ? 'ocultada' : 'visível'} para "${atualizado.nome}".`,
          });
        }}
      />

      <ConfirmDialog
        isOpen={!!empresaToDelete}
        title="Excluir empresa"
        description={`Tem certeza que deseja excluir "${empresaToDelete?.nome}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setEmpresaToDelete(null)}
      />

      <ResetSenhaDialog
        isOpen={!!empresaForSenha}
        empresaNome={empresaForSenha?.nome || ''}
        loading={resettingSenha}
        error={resetSenhaError}
        onConfirm={confirmResetSenha}
        onCancel={() => setEmpresaForSenha(null)}
      />
    </div>
  );
};

const ActionButton: React.FC<{
  title: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}> = ({ title, onClick, tone = 'default', children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`rounded-lg p-2 transition-colors ${
      tone === 'danger'
        ? 'text-gray-400 hover:bg-red-50 hover:text-red-600'
        : 'text-gray-400 hover:bg-orange-50 hover:text-orange-500'
    }`}
  >
    {children}
  </button>
);

export default SuperAdminEmpresasPage;
