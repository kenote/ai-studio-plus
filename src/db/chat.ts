import { db } from './'
import type { Chat } from '@/types/chat'
import { isArray, isString, map } from 'lodash-es'

export async function getChatName(chat: Chat, defaultName: string = '新会话') {
  if (chat) {
    if (chat.title) {
      return chat.title
    }
    const message = await db.messages
      .where('chatId')
      .equals(chat.id!)
      .filter((m) => m.role === 'user')
      .first()
    if (isArray(message?.content)) {
      const content = map(
        message.content.filter((v) => v.type === 'text'),
        'text',
      ).join('')
      return content.slice(0, 50)
    } else if (isString(message?.content)) {
      return message?.content.slice(0, 50)
    }
    return defaultName
  }
}
