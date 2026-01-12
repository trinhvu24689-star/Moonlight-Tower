
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // QUAN TRỌNG: Dùng './' thay vì '/' để app chạy được trong môi trường file system (WebIntoApp/Cordova)
  // Nếu để mặc định '/', app sẽ bị màn hình trắng trên điện thoại.
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
