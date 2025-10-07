import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.ELEVENLABS_API_KEY': JSON.stringify(env.ELEVENLABS_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: `__dirname` is not available in an ES module context.
          // `path.resolve('.')` resolves to the current working directory,
          // which is the project root when Vite is running.
          '@': path.resolve('.'),
        }
      }
    };
});