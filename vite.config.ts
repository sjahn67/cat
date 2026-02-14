import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    root: path.join(__dirname, 'frontend'),
    build: {
        outDir: 'dist', // frontend/dist 로 빌드됨
        emptyOutDir: true,
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3001'
        }
    }
})