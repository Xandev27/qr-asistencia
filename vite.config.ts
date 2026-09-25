import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: [
      'lucide-react', 
      'recharts', 
      'html5-qrcode', 
      'react-dom/client',
      '@supabase/supabase-js'
    ]
  }
})
