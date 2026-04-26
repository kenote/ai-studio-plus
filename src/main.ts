import 'virtual:uno.css'
import './assets/less/main.less'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.config.warnHandler = (msg, instance) => {
  if (msg.includes('Hydration') || msg.includes('hydrate') || msg.includes('mismatch')) return
  console.warn(msg, instance)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
