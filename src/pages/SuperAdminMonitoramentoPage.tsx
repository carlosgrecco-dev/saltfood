import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Database, AlertOctagon, CreditCard, HardDriveDownload, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchMonitoramento, gerarBackupAgora, baixarBackup } from '../lib/superAdminMonitoramento';
import { MonitoramentoResumo } from '../types/SuperAdminMonitoramento';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SuperAdminMonitoramentoPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [dados, setDados] = useState<MonitoramentoResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [baixandoArquivo, setBaixandoArquivo] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.kind !== 'superadmin') return;
      signOutSuperAdmin();
      navigate('/super-admin', { replace: true });
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [navigate]);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDados(await fetchMonitoramento());
    } catch {
      setDados(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  if (!authorized) return null;

  const handleGerarBackup = async () => {
    if (!window.confirm('Gerar um backup agora? Isso lê todas as tabelas do banco — pode levar alguns segundos.')) return;
    setErro('');
    setGerando(true);
    try {
      await gerarBackupAgora();
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível gerar o backup.');
    } finally {
      setGerando(false);
    }
  };

  const handleBaixar = async (nomeArquivo: string) => {
    setBaixandoArquivo(nomeArquivo);
    try {
      await baixarBackup(nomeArquivo);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível baixar o backup.');
    } finally {
      setBaixandoArquivo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate('/super-admin/dashboard')}
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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Activity className="h-5 w-5 text-orange-500" /> Monitoramento</h1>
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
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : !dados ? (
            <p className="text-center text-gray-400 py-16">Não foi possível carregar os dados.</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`border rounded-2xl p-4 ${dados.banco.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-xs mb-1 flex items-center gap-1 ${dados.banco.ok ? 'text-emerald-700' : 'text-red-700'}`}><Database className="h-3.5 w-3.5" /> Banco de dados</p>
                  <p className={`text-lg font-bold flex items-center gap-1.5 ${dados.banco.ok ? 'text-emerald-800' : 'text-red-800'}`}>
                    {dados.banco.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {dados.banco.ok ? 'Operacional' : 'Instável'}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><AlertOctagon className="h-3.5 w-3.5" /> Erros (24h)</p>
                  <p className="text-lg font-bold text-gray-800">{dados.errosUltimas24h}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Gateways ativos</p>
                  <p className="text-lg font-bold text-gray-800">{dados.gateways.ativos} / {dados.gateways.total}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="font-bold text-gray-800 flex items-center gap-1.5"><HardDriveDownload className="h-4 w-4 text-orange-500" /> Backups</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dados.backups.total} backup(s) · {dados.backups.ultimo ? `último em ${new Date(dados.backups.ultimo.criadoEm).toLocaleString('pt-BR')}` : 'nenhum ainda'}
                    </p>
                  </div>
                  <button
                    onClick={handleGerarBackup}
                    disabled={gerando}
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-4 py-2.5 rounded-lg disabled:opacity-60"
                  >
                    {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />} Fazer backup agora
                  </button>
                </div>
                {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}
                <p className="text-[11px] text-gray-400 mb-4">
                  Snapshot dos dados de todas as tabelas via Prisma (JSON) — não é um dump binário do Postgres. Gerado sob
                  demanda, sem agendamento automático.
                </p>
                <div className="space-y-1.5">
                  {dados.backups.lista.map((b) => (
                    <div key={b.nomeArquivo} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="text-gray-700 truncate">{new Date(b.criadoEm).toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-gray-400">{formatBytes(b.tamanho)}</p>
                      </div>
                      <button
                        onClick={() => handleBaixar(b.nomeArquivo)}
                        disabled={baixandoArquivo === b.nomeArquivo}
                        className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg disabled:opacity-60 shrink-0"
                      >
                        {baixandoArquivo === b.nomeArquivo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Baixar
                      </button>
                    </div>
                  ))}
                  {dados.backups.lista.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum backup gerado ainda.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminMonitoramentoPage;
