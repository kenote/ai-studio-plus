import Dexie, { type Table } from 'dexie'
import type { Provider, Group, Model } from '@/types/provider'
import type { Chat, Message } from '@/types/chat'
import type { Config, FilterTable, Mapping } from '@/types/config'

export class AppDatabase extends Dexie {
  providers!: Table<Provider>
  groups!: Table<Group>
  models!: Table<Model>
  chats!: Table<Chat>
  messages!: Table<Message>
  config!: Table<Config>
  filters!: Table<FilterTable>
  mappings!: Table<Mapping>

  constructor() {
    super('ai-studio-plus')
    this.version(1).stores({
      providers: '++id, name',
      groups: '++id, providerId, name',
      models: '++id, providerId, groupId',
      chats: '++id, title, createdAt, updatedAt',
      messages: '++id, chatId, role, createdAt',
      config: 'id',
      filters: '++id, name, pattern',
      mappings: '++id, source',
    })
  }
}

export const db = new AppDatabase()
