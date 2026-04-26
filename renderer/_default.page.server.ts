export { render }
export const passToClient = ['pageProps', 'documentProps']

import { renderToString as renderToString_ } from '@vue/server-renderer'
import type { App } from 'vue'
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr/server'
import { createApp } from './app'
import type { PageContextServer } from './types'

async function render(pageContext: PageContextServer) {
  const { Page, pageProps, exports } = pageContext
  if (!Page) throw new Error('render() hook expects pageContext.Page to be defined')
  const app = createApp(Page, pageProps, pageContext)

  const appHtml = await renderToString(app)

  const { documentProps } = exports
  const title = (documentProps && documentProps.title) || 'AI Studio Plus'
  const desc = (documentProps && documentProps.description) || 'AI Studio Plus - 基于 Vue 3 + TypeScript 的 AI 对话应用'

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
        <link rel="stylesheet" href="/element-plus/dist/index.css" />
        <link rel="stylesheet" href="/element-plus/theme-chalk/dark/css-vars.css" />
        <style>body{margin:0}#page-loading-bar{position:fixed;top:0;left:0;height:2px;background:#409eff;z-index:9999;transition:width 0.3s;width:30%}</style>
      </head>
      <body>
        <div id="page-loading-bar"></div>
        <div id="app">${dangerouslySkipEscape(appHtml)}</div>
        <!-- Element Plus teleport containers -->
        <div id="el-popper-container"></div>
        <div id="el-overlay-container"></div>
        <div id="el-tooltip-container"></div>
      </body>
    </html>`

  return {
    documentHtml,
    pageContext: {
      documentProps: pageContext.exports?.documentProps
    }
  }
}

async function renderToString(app: App) {
  let err: unknown
  app.config.errorHandler = (err_) => {
    err = err_
  }
  const appHtml = await renderToString_(app)
  if (err) throw err
  return appHtml
}