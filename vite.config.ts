import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { presetWind3 } from 'unocss'
import ssr from 'vite-plugin-ssr/plugin'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function elementPlusCSS() {
  return {
    name: 'element-plus-css',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl || req.url || ''
        if (url.includes('/element-plus/') && url.endsWith('.css')) {
          const filePath = resolve(__dirname, 'node_modules', url.replace(/^\//, ''))
          try {
            const fs = await import('fs')
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/css')
              res.end(fs.readFileSync(filePath))
              return
            }
          } catch {
            // continue
          }
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS({
      presets: [presetWind3()],
    }),
    ssr({
      prerender: false,
    }),
    elementPlusCSS(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})