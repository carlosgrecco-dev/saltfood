import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

/**
 * Captura o beforeinstallprompt do navegador uma única vez, no nível do app, e guarda pra
 * disparar sob demanda (botão "Instalar app") em vez de depender do mini-infobar automático do
 * Chrome — esse só aparece conforme heurísticas de engajamento imprevisíveis. Como é uma SPA, o
 * evento só dispara uma vez por carregamento de página, então o provider precisa envolver o app
 * inteiro (fora do router) pra sobreviver a navegações entre rotas sem perder o evento capturado.
 */
export const InstallPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredEvent(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }, [deferredEvent]);

  return (
    <InstallPromptContext.Provider value={{ canInstall: !installed && !!deferredEvent, promptInstall }}>
      {children}
    </InstallPromptContext.Provider>
  );
};

export const useInstallPrompt = (): InstallPromptContextValue => useContext(InstallPromptContext);
