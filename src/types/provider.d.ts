// 供应商
export declare interface Provider {
  id?: number
  name: string
  apiBase: string
  editing?: boolean
}

/** 模型分组 */
export declare interface Group {
  id?: number
  name: string
  apiKey: string
  providerId: number
  editing?: boolean
}

/** 模型 */
export declare interface Model {
  id?: number
  name: string
  providerId?: number
  groupId?: number
  type: ('chat' | 'image' | 'ocr' | 'video' | 'audio')[]
  editing?: boolean
}
