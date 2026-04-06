import Dexie, { type Table } from 'dexie'
import type { Provider, Group, Model } from '@/types/provider'
import type { Chat, Message } from '@/types/chat'

export class AppDatabase extends Dexie {
  providers!: Table<Provider>
  groups!: Table<Group>
  models!: Table<Model>
  chats!: Table<Chat>
  messages!: Table<Message>

  constructor() {
    super('ai-studio-plus')
    this.version(1).stores({
      providers: '++id, name',
      groups: '++id, providerId, name',
      models: '++id, providerId, groupId',
      chats: '++id, title, createdAt, updatedAt',
      messages: '++id, chatId, role, createdAt',
    })
  }
}

export const db = new AppDatabase()
