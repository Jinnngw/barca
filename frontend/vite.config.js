import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'wo1141777op6.vicp.fun',
      '299lv8138zh6.vicp.fun',
      'localhost',
      '127.0.0.1',
      '172.20.10.6'
    ],
    cors: true,
    proxy: {
      '/api': {
        target: 'https://299lv8138zh6.vicp.fun',
        changeOrigin: true,
        secure: false, // 忽略SSL证书验证
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  }
})
