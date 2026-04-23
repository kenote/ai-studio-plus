/** 配置类型 */
export declare interface Config {
  id?: number
  /** 主题 */
  theme: 'light' | 'dark' | 'auto'
  /** 联网搜索 */
  search?: {
    open: boolean
    type?: 'searxng' | 'tavily'
    searxng?: string
    tavily: {
      host?: string
      token?: string
    }
  }
  /** 开启归档 */
  archive: boolean
  /** Joplin 配置 */
  joplin: {
    host?: string
    token: string
    folder?: string
  }
}

/** 名称过滤 */
export declare interface FilterTable<T = string> {
  id?: number
  name: string
  pattern?: T
  editing?: boolean
}

/** 映射关系 */
export declare interface Mapping {
  id?: number
  source: string
  destination: string
}
