import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { presetWind3 } from 'unocss'
import { fileURLToPath, URL } from 'node:url'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS({
      presets: [presetWind3()],
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: false,
        }),
      ],
      dts: 'src/components.d.ts',
    }),
    AutoImport({
      resolvers: [
        ElementPlusResolver({
          importStyle: false,
        }),
      ],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/client',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: fileURLToPath(new URL('./spa.html', import.meta.url)),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) return 'element-plus'
            if (id.includes('vue')) return 'vue'
            if (id.includes('@vueuse')) return 'vueuse'
            if (id.includes('highlight.js')) return 'highlight'
            if (id.includes('marked')) return 'marked'
            return 'vendor'
          }
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
})
