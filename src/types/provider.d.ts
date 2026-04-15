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
  type: ModelType[]
  editing?: boolean
}

export declare type ModelType = 'chat' | 'image' | 'ocr' | 'video' | 'audio'

export declare type ModelGroup = {
  groupName: string
  models: Model[]
}
