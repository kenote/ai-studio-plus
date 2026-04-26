import { db } from './'
import type { Chat } from '@/types/chat'
import { isArray, isString, map } from 'lodash-es'

export async function getChatName(chat: Chat, defaultName: string = '新会话') {
  if (chat) {
    if (chat.title) {
      return chat.title
    }
    const message = await db.messages.where('chatId').equals(chat.id!).first()
    if (isArray(message?.content)) {
      const content = map(
        message.content.filter((v) => v.type === 'text'),
        'text',
      ).join('')
      console.log(content)
      return content
    } else if (isString(message?.content)) {
      return message?.content
    }
    return defaultName
  }
}
