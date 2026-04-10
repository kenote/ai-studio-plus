<template>
  <div class="chat-page h-full flex">
    <ChatSidebar :active-chat-id="activeChatId" @select="selectChat" @create="createChat" />
    <main class="flex-1 flex flex-col min-w-0">
      <ChatContent :chat="activeChat" @update:chat="onChatUpdate" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/db'
import type { Chat } from '@/types/chat'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatContent from '@/components/chat/ChatContent.vue'

const activeChatId = ref<number>()
const activeChat = ref<Chat>()

const selectChat = async (chat: Chat) => {
  if (!chat.id) return
  activeChatId.value = chat.id
  activeChat.value = chat
}

const createChat = async () => {
  const now = new Date()
  const id = await db.chats.add({
    title: '新会话',
    modelId: 1,
    providerId: 1,
    messages: [],
    createdAt: now,
    updatedAt: now,
    activeAt: now,
  })
  activeChatId.value = id
  activeChat.value = await db.chats.get(id)
}

const onChatUpdate = (chat: Chat) => {
  activeChat.value = chat
}

onMounted(async () => {
  const chats = await db.chats.orderBy('updatedAt').reverse().toArray()
  const firstChat = chats[0]
  if (firstChat) {
    await selectChat(firstChat)
  }
})
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100%;
}
</style>
