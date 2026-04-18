<template>
  <div class="chat-page h-full flex">
    <ChatSidebar />
    <main class="flex-1 flex flex-col min-w-0">
      <ChatContent :chat="activeChat" @update:chat="onChatUpdate" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { db } from '@/db'
import type { Chat } from '@/types/chat'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatContent from '@/components/chat/ChatContent.vue'
import { useRoute } from 'vue-router'

// const router = useRouter()
const route = useRoute()
const activeChat = ref<Chat>()

const onChatUpdate = (chat: Chat) => {
  activeChat.value = chat
}

const loadChat = async () => {
  const id = route.params.id
  console.log(id)
  if (id) {
    const chat = await db.chats.get(Number(id))
    console.log(chat)
    if (chat) {
      activeChat.value = chat
      return
    }
  }
  activeChat.value = undefined
}

watch(
  () => route.params.id,
  () => {
    loadChat()
  },
)

onMounted(() => {
  loadChat()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100%;
}
</style>
