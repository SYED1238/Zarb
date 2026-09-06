import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_'],
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'hero-images-provider',
      configureServer(server) {
        server.middlewares.use('/api/hero-images', (_req, res) => {
          try {
            const dir = path.resolve(process.cwd(), 'public/images/hero/women');
            const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
            const numSort = (a: string, b: string) => {
              const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
              const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
              return numA - numB;
            };
            const desktop = files
              .filter(f => /^desktop-.*\.(jpg|jpeg|png|webp|avif)$/i.test(f))
              .sort(numSort)
              .map(f => `/images/hero/women/${f}`);
            const mobile = files
              .filter(f => /^mobile-.*\.(jpg|jpeg|png|webp|avif)$/i.test(f))
              .sort(numSort)
              .map(f => `/images/hero/women/${f}`);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ desktop, mobile }));
          } catch {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ desktop: [], mobile: [] }));
          }
        });
      }
    }
  ],
})
