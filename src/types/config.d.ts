/** 配置类型 */
export declare interface Config {
  id?: number
  /** 主题 */
  theme: 'light' | 'dark' | 'auto'
}

/** 名称过滤 */
export declare interface FilterTable<T = Regexp> {
  id?: number
  name: string
  regexp?: T
  editing?: boolean
}

/** 映射关系 */
export declare interface Mapping {
  source: string
  destination: string
}
