import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path' // ESM 환경에서 node:path 권장

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'), // = '<repo>/src'
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true, // 포트 점유 시 자동 증가 방지(선택)
    },
})
