export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface CapturedPrompt {
  event: BeforeInstallPromptEvent;
  /** href do <link rel="manifest"> ativo no momento em que o navegador disparou o evento — usado
   * depois pra não oferecer instalação nativa se o manifest ativo já trocou de loja (ex: navegação
   * client-side entre duas lojas na mesma aba, sem recarregar a página). */
  manifestHref: string | null;
}

let captured: CapturedPrompt | null = null;

export const getActiveManifestHref = (): string | null =>
  document.getElementById('app-manifest')?.getAttribute('href') ?? null;

export const getCapturedInstallPrompt = (): CapturedPrompt | null => captured;

export const clearCapturedInstallPrompt = (): void => {
  captured = null;
};

/** Dispara sempre que o prompt capturado ou o manifest ativo mudam, pra quem estiver de olho
 * (InstallPromptContext) reavaliar se pode oferecer instalação agora. */
const notify = () => window.dispatchEvent(new CustomEvent('kifood:pwa-state-changed'));

export const notifyManifestChanged = (): void => {
  notify();
};

// Registrado no carregamento do módulo — ANTES do React montar (main.tsx importa este arquivo
// antes de chamar render). O beforeinstallprompt só dispara uma vez por sessão; capturar isso só
// dentro de um useEffect que monta depois do bundle inteiro carregar pode perder essa janela.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  captured = { event: e as BeforeInstallPromptEvent, manifestHref: getActiveManifestHref() };
  notify();
});

window.addEventListener('appinstalled', () => {
  captured = null;
  notify();
});
