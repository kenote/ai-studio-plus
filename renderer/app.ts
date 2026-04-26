import { createSSRApp, defineComponent, h } from 'vue'
import { ZINDEX_INJECTION_KEY, ID_INJECTION_KEY } from 'element-plus'
import PageShell from './PageShell.vue'
import router from '../src/router'
import ElementPlus from 'element-plus'
import '../src/assets/less/main.less'
import type { Component, PageContext, PageProps } from './types'

export { createApp }

function createApp(Page: Component, pageProps: PageProps | undefined, pageContext: PageContext) {
  const PageWithLayout = defineComponent({
    render() {
      return h(PageShell, {}, {
        default: () => h(Page, pageProps || {})
      })
    }
  })

  const app = createSSRApp(PageWithLayout)
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
  app.provide(ID_INJECTION_KEY, { prefix: Math.floor(Math.random() * 1000), current: 1 })
  app.config.warnHandler = (msg) => {
    if (msg.includes('Hydration') || msg.includes('hydrate') || msg.includes('mismatch')) return
  }
  app.use(router)
  app.use(ElementPlus)
  return app
}