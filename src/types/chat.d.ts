/** 聊天会话 */
export declare interface Chat {
  id?: number
  title: string
  modelId: number
  providerId: number
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  activeAt: Date
}

/** 消息 */
export declare interface Message {
  id?: number
  chatId?: number
  role: 'user' | 'assistant' | 'system'
  content: string | (TextContent | ImageContent)[]
  createdAt: Date
  model?: string
  provider: string
}

/** 文字消息 */
type TextContent = {
  type: 'text'
  text: string
}

/** 图片消息 */
type ImageContent = {
  type: 'image_url'
  image_url: { url: string }
}
