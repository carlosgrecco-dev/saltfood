import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDriveDownload, Database, Building2, Clock3, Download, Trash2, Loader2, ScrollText, RefreshCw } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import DonutChart from '../components/DonutChart';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchBackups, gerarBackupPlataforma, gerarBackupTenant, baixarBackup, removerBackup } from '../lib/superAdminBackups';
import { fetchEmpresas } from '../lib/empresas';
import { BackupInfo } from '../types/SuperAdminBackup';
import { Empresa } from '../types/Empresa';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SuperAdminBackupTenantsPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);

  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [tenantSelecionado, setTenantSelecionado] = useState('');
  const [gerandoPlataforma, setGerandoPlataforma] = useState(false);
  const [gerandoTenant, setGerandoTenant] = useState(false);
  const [baixandoArquivo, setBaixandoArquivo] = useState<string | null>(null);
  const [removendoArquivo, setRemovendoArquivo] = useState<string | null>(null);
  const [erro, setErro] = useState('');

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
      setBackups(await fetchBackups());
    } catch {
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    load();
    fetchEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  }, [authorized, load]);

  if (!authorized) return null;

  const handleGerarPlataforma = async () => {
    if (!window.confirm('Gerar um backup de toda a plataforma agora? Isso lê todas as tabelas do banco — pode levar alguns segundos.')) return;
    setErro('');
    setGerandoPlataforma(true);
    try {
      await gerarBackupPlataforma();
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível gerar o backup.');
    } finally {
      setGerandoPlataforma(false);
    }
  };

  const handleGerarTenant = async () => {
    if (!tenantSelecionado) return;
    setErro('');
    setGerandoTenant(true);
    try {
      await gerarBackupTenant(tenantSelecionado);
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível gerar o backup do tenant.');
    } finally {
      setGerandoTenant(false);
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

  const handleRemover = async (backup: BackupInfo) => {
    if (!window.confirm(`Apagar este backup${backup.empresaNome ? ` de "${backup.empresaNome}"` : ' completo da plataforma'}? Não há como desfazer.`)) return;
    setRemovendoArquivo(backup.nomeArquivo);
    try {
      await removerBackup(backup.nomeArquivo);
      setBackups((prev) => prev.filter((b) => b.nomeArquivo !== backup.nomeArquivo));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível apagar o backup.');
    } finally {
      setRemovendoArquivo(null);
    }
  };

  const backupsFiltrados = filtroEmpresa
    ? backups.filter((b) => (filtroEmpresa === 'plataforma' ? b.escopo === 'PLATAFORMA' : b.empresaId === filtroEmpresa))
    : backups;

  const totalArmazenamento = backups.reduce((s, b) => s + b.tamanho, 0);
  const totalTenant = backups.filter((b) => b.escopo === 'TENANT');
  const totalPlataforma = backups.filter((b) => b.escopo === 'PLATAFORMA');
  const tamanhoTenant = totalTenant.reduce((s, b) => s + b.tamanho, 0);
  const tamanhoPlataforma = totalPlataforma.reduce((s, b) => s + b.tamanho, 0);
  const ultimoBackup = backups[0] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><HardDriveDownload className="h-5 w-5 text-orange-500" /> Backup dos Tenants</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Gerencie e baixe backups de todos os tenants da plataforma.</p>
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

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          <p className="text-xs text-gray-400 bg-gray-100 rounded-xl px-4 py-3">
            Snapshot dos dados via Prisma (JSON) — não é um dump binário do Postgres. Backup sob demanda, sem
            agendamento automático nem exclusão por retenção (apagar é manual, abaixo).
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide"><Database className="h-3.5 w-3.5" /> Total de backups</p>
              <p className="text-2xl font-bold text-gray-800">{backups.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide"><HardDriveDownload className="h-3.5 w-3.5" /> Armazenamento utilizado</p>
              <p className="text-2xl font-bold text-gray-800">{formatBytes(totalArmazenamento)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide"><Building2 className="h-3.5 w-3.5" /> Backups por tenant</p>
              <p className="text-2xl font-bold text-gray-800">{totalTenant.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide"><Clock3 className="h-3.5 w-3.5" /> Último backup</p>
              <p className="text-sm font-bold text-gray-800">{ultimoBackup ? new Date(ultimoBackup.criadoEm).toLocaleString('pt-BR') : 'Nenhum ainda'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
                <button
                  onClick={handleGerarPlataforma}
                  disabled={gerandoPlataforma}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-4 py-2.5 rounded-lg disabled:opacity-60"
                >
                  {gerandoPlataforma ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
                  Gerar backup completo
                </button>

                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tenant</label>
                    <select
                      value={tenantSelecionado}
                      onChange={(e) => setTenantSelecionado(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[180px]"
                    >
                      <option value="">Selecione...</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleGerarTenant}
                    disabled={gerandoTenant || !tenantSelecionado}
                    className="flex items-center gap-1.5 border border-orange-300 text-orange-600 hover:bg-orange-50 font-medium text-sm px-4 py-2.5 rounded-lg disabled:opacity-60"
                  >
                    {gerandoTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
                    Gerar backup deste tenant
                  </button>
                </div>

                <div className="ml-auto flex items-end gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Filtrar por</label>
                    <select
                      value={filtroEmpresa}
                      onChange={(e) => setFiltroEmpresa(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Todos os backups</option>
                      <option value="plataforma">Só plataforma inteira</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500 border border-gray-200 px-3 py-2.5 rounded-lg">
                    <RefreshCw className="h-3.5 w-3.5" /> Atualizar
                  </button>
                </div>
              </div>

              {erro && <p className="text-xs text-red-600 px-1">{erro}</p>}

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <p className="font-bold text-gray-800 px-5 pt-5 pb-4">Backups realizados ({backupsFiltrados.length})</p>
                {loading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                          <th className="py-2.5 px-4">Data/hora</th>
                          <th className="py-2.5 px-4">Empresa (Tenant)</th>
                          <th className="py-2.5 px-4 text-right">Tamanho</th>
                          <th className="py-2.5 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupsFiltrados.map((b) => (
                          <tr key={b.nomeArquivo} className="border-t border-gray-100">
                            <td className="px-4 py-3 text-gray-500 text-xs">{new Date(b.criadoEm).toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {b.escopo === 'TENANT' ? (b.empresaNome || 'Empresa removida') : (
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">Plataforma inteira</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">{formatBytes(b.tamanho)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleBaixar(b.nomeArquivo)}
                                  disabled={baixandoArquivo === b.nomeArquivo}
                                  className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                                >
                                  {baixandoArquivo === b.nomeArquivo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Baixar
                                </button>
                                <button
                                  onClick={() => handleRemover(b)}
                                  disabled={removendoArquivo === b.nomeArquivo}
                                  className="flex items-center gap-1 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                                >
                                  {removendoArquivo === b.nomeArquivo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {backupsFiltrados.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Nenhum backup gerado ainda.</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="font-bold text-gray-800 mb-4">Armazenamento</p>
                <DonutChart
                  segments={[
                    { label: 'Plataforma', value: tamanhoPlataforma, colorClass: 'bg-orange-500', strokeClass: 'stroke-orange-500' },
                    { label: 'Por tenant', value: tamanhoTenant, colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
                  ]}
                  formatValue={formatBytes}
                  centerLabel="Total"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="font-bold text-gray-800 mb-3">Ações rápidas</p>
                <div className="space-y-1">
                  <button
                    onClick={handleGerarPlataforma}
                    disabled={gerandoPlataforma}
                    className="flex w-full items-center gap-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg px-2.5 py-2 disabled:opacity-60"
                  >
                    <HardDriveDownload className="h-4 w-4 shrink-0" /> Executar backup agora
                  </button>
                  <button
                    onClick={() => navigate('/super-admin/logs')}
                    className="flex w-full items-center gap-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg px-2.5 py-2"
                  >
                    <ScrollText className="h-4 w-4 shrink-0" /> Ver Logs do Sistema
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminBackupTenantsPage;
