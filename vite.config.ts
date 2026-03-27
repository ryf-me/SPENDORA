import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const vercelApiPlugin = () => ({
  name: 'vercel-api',
  configureServer(server: any) {
    const app = express();
    app.use(express.json());
    app.post('/api/ai-assistant', async (req, res) => {
      try {
        const handler = await import('./api/ai-assistant.js');
        await handler.default(req, res);
      } catch (err) {
        console.error('Local API Error:', err);
        res.status(500).json({ error: 'Local API Server Error' });
      }
    });
    server.middlewares.use(app);
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), vercelApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
