import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Save, ArrowLeft, Loader2, KeyRound, Plus, Trash2 } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchConfiguracaoPlataforma, updateConfiguracaoPlataforma } from '../lib/configuracoesPlataforma';

type Feedback = { type: 'success' | 'error'; message: string } | null;

const SuperAdminConfiguracoesPage: React.FC = () => {
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
  const [navOpen, setNavOpen] = useState(true);

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
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

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
    <div className="min-h-screen bg-slate-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-16 ${navOpen ? 'sm:ml-72' : ''}`}>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/super-admin/empresas')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/saltfood-icon.png" alt="SaltFood" className="h-11 w-11" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Super Admin</p>
                <h1 className="text-xl font-bold text-slate-900">Configurações Globais da Plataforma</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { signOutSuperAdmin(); navigate('/super-admin', { replace: true }); }}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
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
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                <Settings className="h-4 w-4 text-indigo-600" /> Dados da sua empresa
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nome da empresa</label>
                  <input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">CNPJ</label>
                  <input value={documento} onChange={(e) => setDocumento(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">E-mail de suporte</label>
                  <input type="email" value={emailSuporte} onChange={(e) => setEmailSuporte(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Telefone de suporte</label>
                  <input value={telefoneSuporte} onChange={(e) => setTelefoneSuporte(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Endereço</label>
                  <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-800 mb-4">Termos de uso padrão para lojistas</h2>
              <textarea
                value={termosPadraoLojistas}
                onChange={(e) => setTermosPadraoLojistas(e.target.value)}
                rows={8}
                placeholder="Termo de uso da plataforma que todo lojista aceita ao ser cadastrado..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-y"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                <KeyRound className="h-4 w-4 text-indigo-600" /> Chaves globais de integração
              </h2>
              <p className="text-xs text-slate-400 mb-4">
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
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-56 font-mono"
                    />
                    <input
                      value={item.valor}
                      onChange={(e) => setChaves((prev) => prev.map((c, i) => (i === idx ? { ...c, valor: e.target.value } : c)))}
                      placeholder="valor"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <button type="button" onClick={() => setChaves((prev) => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-600 p-1.5">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setChaves((prev) => [...prev, { chave: '', valor: '' }])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar chave
                </button>
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
};

export default SuperAdminConfiguracoesPage;
