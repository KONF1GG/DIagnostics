import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   // server: {
//   //   host: '192.168.111.62',
//   //   port: 3000
//   // }
//     server: {
//       host: '192.168.0.101',
//       port: 3000
//     }
// })

// vite.config.ts

export default defineConfig({
  server: {
    proxy: {
      '/UNF_CRM_WS': {
        target: 'http://server1c.freedom1.ru',
        changeOrigin: true, // Меняет Origin на тот, что у целевого сервера
        secure: false, // Убедитесь, что это настроено правильно, если используется HTTPS
        rewrite: (path) => path.replace(/^\/UNF_CRM_WS/, ''), // Переписывает путь
      },
    },
  },
});