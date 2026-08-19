import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Em ambientes de preview/sandbox (iframe embutido) o WebSocket de HMR
    // costuma falhar por não ter a porta exposta corretamente. Desativar
    // evita o erro no console; em dev local normal, dá pra remover esse
    // bloco pra recuperar o live-reload automático.
    hmr: false,
  },
});
