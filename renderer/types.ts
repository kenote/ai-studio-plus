export type { PageContextServer }
export type { PageContextClient }
export type { PageContext }
export type { PageProps }
export type { Component }

import type {
  PageContextBuiltInServer,
  PageContextBuiltInClientWithServerRouting as PageContextBuiltInClient
} from 'vite-plugin-ssr/types'
import type { ComponentPublicInstance } from 'vue'

type Component = ComponentPublicInstance
type Page = Component
type PageProps = object

export type PageContextCustom = {
  Page: Page
  pageProps?: PageProps
  urlPathname: string
  exports: {
    documentProps?: {
      title?: string
      description?: string
    }
  }
}

type PageContextServer = PageContextBuiltInServer<Page> & PageContextCustom
type PageContextClient = PageContextBuiltInClient<Page> & PageContextCustom

type PageContext = PageContextClient | PageContextServer