import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Registra o listener de beforeinstallprompt no carregamento do módulo, antes do React montar —
// ver comentário em lib/installPrompt.ts.
import './lib/installPrompt';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // registro silencioso — não bloqueia o app se falhar
      });
    });
  } else {
    // Em dev, o SW acaba interceptando os próprios requests do Vite
    // (/@vite/client, /src/*), causando "Failed to convert value to 'Response'".
    // Garante que nenhuma versão fique ativa enquanto rodamos `vite dev`.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
}
