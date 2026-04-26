export { render }
export const clientRouting = true

import 'virtual:uno.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { createApp } from './app'
import type { PageContextClient } from './types'

let mountedApp: ReturnType<typeof createApp> | null = null

function hideLoading() {
  const bar = document.querySelector('#page-loading-bar') as HTMLElement | null
  if (bar) {
    bar.style.width = '100%'
    setTimeout(() => bar.remove(), 300)
  }
}

async function render(pageContext: PageContextClient) {
  const { Page, pageProps, isHydration, documentProps } = pageContext
  if (!Page) throw new Error('Client-side render() hook expects pageContext.Page to be defined')

  if (mountedApp) {
    mountedApp.unmount()
  }

  const app = createApp(Page, pageProps, pageContext)
  mountedApp = app

  if (!isHydration && documentProps) {
    document.title = documentProps.title || 'AI Studio Plus'
  }

  app.mount('#app')

  hideLoading()
}