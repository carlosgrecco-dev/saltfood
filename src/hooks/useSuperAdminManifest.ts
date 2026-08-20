import { useEffect } from 'react';
import { notifyManifestChanged } from '../lib/installPrompt';

/** Troca o manifest do PWA pro do Super Admin enquanto a página estiver montada — mesmo padrão
 * do TenantContext, mas fixo (não depende de slug). Sem isso, instalar o atalho de dentro do
 * Super Admin sempre reabria a landing page (o manifest padrão tem start_url "/"). */
export function useSuperAdminManifest(): void {
  useEffect(() => {
    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = '/super-admin-manifest.json';
    notifyManifestChanged();

    return () => {
      manifestLink!.href = '/manifest.json';
      notifyManifestChanged();
    };
  }, []);
}
