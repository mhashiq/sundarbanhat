import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  // Disable Oxc (Vite 8 default) due to parser incompatibility with complex JSX.
  // Falls back to Babel via @vitejs/plugin-react.
  oxc: false,
})
