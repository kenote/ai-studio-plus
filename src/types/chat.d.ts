import { ModelInfo } from './provider'

/** 请求消息 */
export declare interface AIRequest extends ModelInfo {
  messages: Pick<Message, 'role' | 'content'>[]
  stream?: boolean
}

/** 聊天会话 */
export declare interface Chat {
  id?: number
  title?: string
  modelId: number
  providerId: number
  messages: Message[]
  createdAt: number
  updatedAt: number
  activeAt: number
}

/** 消息内容项 */
type ContentItem = TextContent | ImageContent

/** 消息 */
export declare interface Message {
  id?: number
  chatId?: number
  role: 'user' | 'assistant' | 'system'
  content: string | ImageContent | ContentItem[]
  createdAt?: number
  modelId?: number
  modelFullName?: string
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
