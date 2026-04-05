// 供应商
export interface Provider {
  id?: number
  name: string
  apiBase: string
  editing?: boolean
}

/** 模型分组 */
export interface Group {
  id?: number
  name: string
  apiKey: string
  providerId: number
  editing?: boolean
}

/** 模型 */
export declare interface Model {
  id?: number
  pid: string
  name: string
  providerId: number
  groupId: number
  type: ('chat' | 'image' | 'ocr' | 'video' | 'audio')[]
}
