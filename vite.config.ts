import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do arquivo .env localizado na raiz.
  // O terceiro parâmetro '' garante que carreguemos variáveis sem o prefixo VITE_.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Define globalmente process.env.API_KEY para que o código React possa acessá-lo.
      // Isso substitui a string 'process.env.API_KEY' pelo valor real durante o build/dev.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
    },
  };
});