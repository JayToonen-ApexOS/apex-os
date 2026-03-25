import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
  },

  optimizeDeps: {
    // Zorg dat React-core altijd pre-gebundeld is, zodat de module runner
    // nooit een .jsx bestand via Node.js native ESM hoeft te laden.
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
  },
})
