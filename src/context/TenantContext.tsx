import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useLocation, Outlet } from 'react-router-dom';
import { Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { fetchEmpresaPublicBySlug } from '../lib/empresas';
import { API_URL, ApiError } from '../lib/apiClient';
import { EmpresaPublic } from '../types/Empresa';

interface TenantContextValue {
  slug: string;
  empresa: EmpresaPublic;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

/** Dá acesso à empresa (tenant) resolvida a partir do slug na URL atual. Só pode ser usado dentro de rotas /:slug. */
export const useTenant = (): TenantContextValue => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant deve ser usado dentro de uma rota /:slug (<TenantProvider>)');
  return ctx;
};

type Status = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * Resolve o slug da URL (/:slug/...) para os dados públicos da empresa antes de
 * renderizar as rotas filhas, mostrando estados de carregamento/erro/loja inativa.
 */
const TenantProvider: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const location = useLocation();
  const [empresa, setEmpresa] = useState<EmpresaPublic | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setEmpresa(null);

    fetchEmpresaPublicBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setEmpresa(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err instanceof ApiError && err.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!empresa) return;

    document.documentElement.style.setProperty('--cor-primaria', empresa.corPrimaria);
    document.documentElement.style.setProperty('--cor-secundaria', empresa.corSecundaria);

    if (empresa.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = empresa.faviconUrl;
    }

    document.title = empresa.nome;

    // PWA: cada loja instala como um app próprio (nome, ícone e URL de abertura da loja). O
    // manifest fica numa URL estável servida pela API (não um blob: gerado em memória) — um
    // blob muda a cada carregamento de página, e o Chrome decide se mostra o prompt de instalação
    // com base na URL do manifest; isso fazia o prompt às vezes não refletir a loja certa.
    // O contexto (loja/admin/motoboy) muda o start_url — sem isso, instalar de dentro do admin ou
    // do portal do motoboy sempre reabria a vitrine da loja, nunca a tela de onde foi instalado.
    const contexto = location.pathname.endsWith('/admin')
      ? 'admin'
      : location.pathname.endsWith('/motoboy')
        ? 'motoboy'
        : 'loja';

    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = `${API_URL}/empresas/slug/${encodeURIComponent(slug)}/manifest.json?contexto=${contexto}`;

    return () => {
      manifestLink!.href = '/manifest.json';
    };
  }, [empresa, slug, location.pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-slate-800">Loja não encontrada</h1>
        <p className="max-w-sm text-sm text-slate-500">
          {status === 'not-found'
            ? `Não encontramos nenhuma loja em "/${slug}". Confira o endereço e tente novamente.`
            : 'Não foi possível carregar os dados da loja agora. Tente novamente em instantes.'}
        </p>
      </div>
    );
  }

  if (empresa && !empresa.empresaAtiva) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
          <Building2 className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="text-lg font-bold text-slate-800">Loja temporariamente indisponível</h1>
        <p className="max-w-sm text-sm text-slate-500">
          {empresa.nome} está indisponível no momento. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ slug, empresa: empresa as EmpresaPublic }}>
      <Outlet />
    </TenantContext.Provider>
  );
};

export default TenantProvider;
