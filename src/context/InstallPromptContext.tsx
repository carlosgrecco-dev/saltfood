import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getActiveManifestHref, getCapturedInstallPrompt, clearCapturedInstallPrompt } from '../lib/installPrompt';

interface InstallPromptContextValue {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
}

const InstallPromptContext = createContext<InstallPromptContextValue>({
  canInstall: false,
  promptInstall: async () => {},
});

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

type NavigatorComRelatedApps = Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };

/**
 * Expõe se dá pra oferecer instalação AGORA — só quando o navegador capturou um beforeinstallprompt
 * (ver lib/installPrompt.ts) E esse evento foi capturado com o MESMO manifest que está ativo neste
 * exato momento. Sem essa checagem, navegar entre duas lojas diferentes na mesma aba (sem recarregar
 * a página) podia oferecer "instalar" usando o prompt nativo avaliado pra loja errada.
 */
export const InstallPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [installed, setInstalled] = useState(isStandalone());
  const [relatedAppInstalled, setRelatedAppInstalled] = useState(false);
  const [manifestHref, setManifestHref] = useState<string | null>(() => getActiveManifestHref());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleChange = () => {
      setManifestHref(getActiveManifestHref());
      forceUpdate((n) => n + 1);
    };
    const handleInstalled = () => setInstalled(true);
    window.addEventListener('kifood:pwa-state-changed', handleChange);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('kifood:pwa-state-changed', handleChange);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // Confirma junto ao navegador se ESTE app (loja + contexto atual) já está instalado — evita
  // mostrar "instalar" de novo pra quem já tem o atalho na tela. Só existe no Chrome Android; nos
  // demais navegadores, segue sem essa checagem extra (comportamento de antes).
  useEffect(() => {
    const nav = navigator as NavigatorComRelatedApps;
    if (!nav.getInstalledRelatedApps) return;
    let cancelled = false;
    nav.getInstalledRelatedApps()
      .then((apps) => {
        if (!cancelled) setRelatedAppInstalled(apps.length > 0);
      })
      .catch(() => {
        if (!cancelled) setRelatedAppInstalled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [manifestHref]);

  const promptInstall = useCallback(async () => {
    const current = getCapturedInstallPrompt();
    if (!current) return;
    await current.event.prompt();
    await current.event.userChoice;
    clearCapturedInstallPrompt();
    forceUpdate((n) => n + 1);
  }, []);

  const captured = getCapturedInstallPrompt();
  const manifestBate = captured !== null && captured.manifestHref === manifestHref;
  const canInstall = !installed && !relatedAppInstalled && manifestBate;

  return (
    <InstallPromptContext.Provider value={{ canInstall, promptInstall }}>
      {children}
    </InstallPromptContext.Provider>
  );
};

export const useInstallPrompt = (): InstallPromptContextValue => useContext(InstallPromptContext);
