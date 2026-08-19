import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, Lock, Loader2, Store, Bike, BarChart3, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInSuperAdmin } from '../lib/superAdminAuth';
import InstallAppButton from '../components/InstallAppButton';

const SuperAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInSuperAdmin(usuario, senha);
      navigate('/super-admin/empresas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 grid md:grid-cols-2">
        {/* Coluna esquerda — formulário */}
        <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
          <div className="w-full max-w-sm mx-auto">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-sm mb-6">
              <img src="/logo-sigma-digital.png" alt="Sigma Soluções Digitais" className="h-full w-full object-cover" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1">Bem-vindo à Sigma! 👋</h1>
            <p className="text-sm text-slate-500 mb-8">Acesse o painel de controle da plataforma</p>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                  Usuário
                </label>
                <div className="flex items-stretch rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                  <span className="flex items-center justify-center w-11 shrink-0 text-slate-400 border-r border-slate-200 bg-white">
                    <UserCircle className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-3 bg-transparent outline-none text-sm text-slate-800"
                    placeholder="usuario.superadmin"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                  Senha
                </label>
                <div className="flex items-stretch rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                  <span className="flex items-center justify-center w-11 shrink-0 text-slate-400 border-r border-slate-200 bg-white">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-3 bg-transparent outline-none text-sm text-slate-800"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                <span>Entrar</span>
              </button>
            </form>

            <p className="text-xs text-slate-300 mt-10">Versão 1.0.0 · Sigma Soluções Digitais</p>
          </div>
        </div>

        {/* Coluna direita — ilustração (só em telas médias+) */}
        <div className="hidden md:flex relative items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50">
          <div className="absolute h-96 w-96 rounded-full bg-indigo-100/70" />
          <div className="absolute h-56 w-56 rounded-full bg-orange-100/60 -translate-x-24 translate-y-32" />

          <div className="relative flex flex-col items-center gap-6">
            {/* "dashboard" central */}
            <div className="relative w-64 rounded-2xl bg-white shadow-xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="flex items-end gap-2 h-24">
                <div className="flex-1 rounded-t-md bg-indigo-200" style={{ height: '55%' }} />
                <div className="flex-1 rounded-t-md bg-indigo-400" style={{ height: '80%' }} />
                <div className="flex-1 rounded-t-md bg-orange-400" style={{ height: '65%' }} />
                <div className="flex-1 rounded-t-md bg-indigo-300" style={{ height: '95%' }} />
                <div className="flex-1 rounded-t-md bg-indigo-500" style={{ height: '40%' }} />
              </div>
              <div className="mt-4 h-2 w-3/4 rounded-full bg-slate-100" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-slate-100" />

              {/* badges flutuantes */}
              <div className="absolute -top-5 -left-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100">
                <Store className="h-5 w-5 text-orange-500" />
              </div>
              <div className="absolute -bottom-5 -right-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100">
                <Bike className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="absolute -top-4 right-10 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 shadow-lg">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="text-center max-w-xs">
              <p className="text-sm font-semibold text-slate-700">Toda a operação das suas lojas, em um só lugar</p>
              <p className="text-xs text-slate-400 mt-1">Empresas, planos, financeiro e muito mais</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
        <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Voltar para o site
        </Link>
        <div className="flex items-center gap-3">
          <InstallAppButton />
          <span className="text-xs text-slate-300 hidden sm:inline">Sigma Soluções Digitais</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
