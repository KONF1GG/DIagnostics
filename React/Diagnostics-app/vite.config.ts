import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: '192.168.111.62',
  //   port: 3000
  // }
    // server: {
    //   host: '192.168.0.101',
    //   port: 3000
    // }
})
