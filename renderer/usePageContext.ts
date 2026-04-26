import { shallowRef } from 'vue'
import type { PageContext } from './types'

const pageContext = shallowRef<PageContext>({} as PageContext)
const setPageContext = (app: unknown, context: PageContext) => {
  pageContext.value = context
}

export { pageContext, setPageContext }

export function usePageContext() {
  return pageContext
}