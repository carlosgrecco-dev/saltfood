import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Save, ArrowLeft, Loader2, KeyRound, Plus, Trash2, Gift, HardDriveDownload, Download } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchConfiguracaoPlataforma, updateConfiguracaoPlataforma } from '../lib/configuracoesPlataforma';
import { fetchBackups, gerarBackupPlataforma, gerarBackupTenant, baixarBackup } from '../lib/superAdminBackups';
import { fetchEmpresas } from '../lib/empresas';
import { BackupInfo } from '../types/SuperAdminBackup';
import { Empresa } from '../types/Empresa';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

type Feedback = { type: 'success' | 'error'; message: string } | null;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SuperAdminConfiguracoesPage: React.FC = () => {
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [documento, setDocumento] = useState('');
  const [emailSuporte, setEmailSuporte] = useState('');
  const [telefoneSuporte, setTelefoneSuporte] = useState('');
  const [endereco, setEndereco] = useState('');
  const [termosPadraoLojistas, setTermosPadraoLojistas] = useState('');
  const [chaves, setChaves] = useState<{ chave: string; valor: string }[]>([]);
  const [recompensaIndicacaoEmpresaValor, setRecompensaIndicacaoEmpresaValor] = useState('0');
  const [navOpen, setNavOpen] = useState(true);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [tenantSelecionado, setTenantSelecionado] = useState('');
  const [gerandoPlataforma, setGerandoPlataforma] = useState(false);
  const [gerandoTenant, setGerandoTenant] = useState(false);
  const [baixandoArquivo, setBaixandoArquivo] = useState<string | null>(null);
  const [erroBackup, setErroBackup] = useState('');

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const config = await fetchConfiguracaoPlataforma();
      setNomeEmpresa(config.nomeEmpresa || '');
      setDocumento(config.documento || '');
      setEmailSuporte(config.emailSuporte || '');
      setTelefoneSuporte(config.telefoneSuporte || '');
      setEndereco(config.endereco || '');
      setTermosPadraoLojistas(config.termosPadraoLojistas || '');
      setChaves(Object.entries(config.chavesGlobais || {}).map(([chave, valor]) => ({ chave, valor })));
      setRecompensaIndicacaoEmpresaValor(String(config.recompensaIndicacaoEmpresaValor ?? 0));
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  const loadBackups = useCallback(async () => {
    try {
      setBackups(await fetchBackups());
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadBackups();
    fetchEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  }, [authorized, loadBackups]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleGerarBackupPlataforma = async () => {
    if (!window.confirm('Gerar um backup de toda a plataforma agora? Isso lê todas as tabelas do banco — pode levar alguns segundos.')) return;
    setErroBackup('');
    setGerandoPlataforma(true);
    try {
      await gerarBackupPlataforma();
      await loadBackups();
    } catch (err) {
      setErroBackup(err instanceof Error ? err.message : 'Não foi possível gerar o backup.');
    } finally {
      setGerandoPlataforma(false);
    }
  };

  const handleGerarBackupTenant = async () => {
    if (!tenantSelecionado) return;
    setErroBackup('');
    setGerandoTenant(true);
    try {
      await gerarBackupTenant(tenantSelecionado);
      await loadBackups();
    } catch (err) {
      setErroBackup(err instanceof Error ? err.message : 'Não foi possível gerar o backup do tenant.');
    } finally {
      setGerandoTenant(false);
    }
  };

  const handleBaixarBackup = async (nomeArquivo: string) => {
    setBaixandoArquivo(nomeArquivo);
    try {
      await baixarBackup(nomeArquivo);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível baixar o backup.');
    } finally {
      setBaixandoArquivo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const chavesGlobais: Record<string, string> = {};
      for (const { chave, valor } of chaves) {
        if (chave.trim()) chavesGlobais[chave.trim()] = valor;
      }
      await updateConfiguracaoPlataforma({
        nomeEmpresa, documento, emailSuporte, telefoneSuporte, endereco, termosPadraoLojistas, chavesGlobais,
        recompensaIndicacaoEmpresaValor: Number(recompensaIndicacaoEmpresaValor) || 0,
      });
      setFeedback({ type: 'success', message: 'Configurações salvas com sucesso.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
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
              <div className="h-11 w-11 shrink-0 rounded-xl bg-black p-1.5">
                <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                <h1 className="text-xl font-bold text-gray-900">Configurações Globais da Plataforma</h1>
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
        {feedback && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {feedback.message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                <Settings className="h-4 w-4 text-orange-500" /> Dados da sua empresa
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nome da empresa</label>
                  <input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CNPJ</label>
                  <input value={documento} onChange={(e) => setDocumento(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">E-mail de suporte</label>
                  <input type="email" value={emailSuporte} onChange={(e) => setEmailSuporte(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Telefone de suporte</label>
                  <input value={telefoneSuporte} onChange={(e) => setTelefoneSuporte(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Endereço</label>
                  <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-1">
                <Gift className="h-4 w-4 text-orange-500" /> Indicação entre lojas
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                Quando um tenant indica outra loja (código próprio, informado no cadastro) e a loja indicada paga a
                1ª fatura, o indicador ganha este valor como crédito — aplicado automaticamente na próxima fatura
                dele. Deixe 0 para desativar o programa.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">R$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={recompensaIndicacaoEmpresaValor}
                  onChange={(e) => setRecompensaIndicacaoEmpresaValor(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-sm text-gray-500">por loja indicada que virar cliente pagante</span>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-bold text-gray-800 mb-4">Termos de uso padrão para lojistas</h2>
              <textarea
                value={termosPadraoLojistas}
                onChange={(e) => setTermosPadraoLojistas(e.target.value)}
                rows={8}
                placeholder="Termo de uso da plataforma que todo lojista aceita ao ser cadastrado..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y"
              />
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-1">
                <KeyRound className="h-4 w-4 text-orange-500" /> Chaves globais de integração
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Chaves usadas por integrações da plataforma como um todo (ex: API de geocodificação, provedor de e-mail).
                Armazenadas em texto simples, mesmo padrão já usado nas credenciais de gateway de cada loja.
              </p>
              <div className="space-y-2">
                {chaves.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={item.chave}
                      onChange={(e) => setChaves((prev) => prev.map((c, i) => (i === idx ? { ...c, chave: e.target.value } : c)))}
                      placeholder="NOME_DA_CHAVE"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 font-mono"
                    />
                    <input
                      value={item.valor}
                      onChange={(e) => setChaves((prev) => prev.map((c, i) => (i === idx ? { ...c, valor: e.target.value } : c)))}
                      placeholder="valor"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button type="button" onClick={() => setChaves((prev) => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-600 p-1.5">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setChaves((prev) => [...prev, { chave: '', valor: '' }])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar chave
                </button>
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </form>
        )}

        {!loading && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 mt-6">
            <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-1">
              <HardDriveDownload className="h-4 w-4 text-orange-500" /> Backups
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              Snapshot dos dados via Prisma (JSON) — não é um dump binário do Postgres. Gerado sob demanda, sem
              agendamento automático.
            </p>

            {erroBackup && <p className="text-xs text-red-600 mb-3">{erroBackup}</p>}

            <div className="flex flex-wrap items-end gap-3 mb-5">
              <button
                onClick={handleGerarBackupPlataforma}
                disabled={gerandoPlataforma}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-4 py-2.5 rounded-lg disabled:opacity-60"
              >
                {gerandoPlataforma ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
                Gerar backup completo da plataforma
              </button>

              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tenant</label>
                  <select
                    value={tenantSelecionado}
                    onChange={(e) => setTenantSelecionado(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
                  >
                    <option value="">Selecione um tenant...</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.nome}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGerarBackupTenant}
                  disabled={gerandoTenant || !tenantSelecionado}
                  className="flex items-center gap-1.5 border border-orange-300 text-orange-600 hover:bg-orange-50 font-medium text-sm px-4 py-2.5 rounded-lg disabled:opacity-60"
                >
                  {gerandoTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
                  Gerar backup deste tenant
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {backups.map((b) => (
                <div key={b.nomeArquivo} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.escopo === 'TENANT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {b.escopo === 'TENANT' ? `Tenant: ${b.empresaNome || 'removido'}` : 'Plataforma'}
                      </span>
                      <p className="text-gray-700 truncate">{new Date(b.criadoEm).toLocaleString('pt-BR')}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatBytes(b.tamanho)}</p>
                  </div>
                  <button
                    onClick={() => handleBaixarBackup(b.nomeArquivo)}
                    disabled={baixandoArquivo === b.nomeArquivo}
                    className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg disabled:opacity-60 shrink-0"
                  >
                    {baixandoArquivo === b.nomeArquivo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Baixar
                  </button>
                </div>
              ))}
              {backups.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum backup gerado ainda.</p>}
            </div>
          </section>
        )}
      </div>
      </div>
    </div>
  );
};

export default SuperAdminConfiguracoesPage;
