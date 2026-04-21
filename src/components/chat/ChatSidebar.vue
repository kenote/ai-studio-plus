<template>
  <div
    class="chat-sidebar-wrapper transition-all duration-200"
    :class="isCollapsed ? 'w-0' : 'w-[240px]'"
  >
    <aside
      class="chat-sidebar h-full flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-dark"
    >
      <div
        class="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800"
      >
        <el-button
          type="info"
          class="w-full"
          @click="router.push(`/chat`)"
          :disabled="!route.params.id"
          :icon="Plus"
          >新建</el-button
        >
      </div>
      <el-scrollbar class="flex-1">
        <div class="p-2 space-y-1">
          <router-link
            v-for="chat in chats"
            :key="chat.id"
            :to="`/chat/${chat.id}`"
            class="group flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
            :class="$route.params.id == chat.id ? 'bg-zinc-200 dark:bg-zinc-700' : ''"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">
                {{ chat.title || '新会话' }}
              </div>
              <div class="text-xs text-zinc-500 truncate">
                {{ formatDate(chat.updatedAt) }}
              </div>
            </div>
            <button
              @click.prevent.stop="deleteChat(chat)"
              class="opacity-0 group-hover:opacity-100 p-1 rounded border-0 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              title="删除"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </router-link>
          <div v-if="chats.length === 0" class="text-center text-zinc-400 text-sm py-8">
            暂无会话
          </div>
        </div>
      </el-scrollbar>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db } from '@/db'
import type { Chat } from '@/types/chat'
import { emitter, Events } from '@/utils/emitter'
import { getChatName } from '@/db/chat'
import { formatDate } from '@/utils/message'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCollapsed = ref(false)
const chats = ref<Chat[]>([])

const loadChats = async () => {
  const list = await db.chats.orderBy('updatedAt').reverse().toArray()

  // 使用 Promise.all 等待数组中所有的异步 getChatName 执行完毕
  chats.value = await Promise.all(
    list.map(async (v: Chat) => {
      v.title = await getChatName(v)
      return v
    }),
  )
}

const deleteChat = async (chat: Chat) => {
  console.log(chat.id)
  if (chat.id) {
    const index = chats.value.findIndex((v) => v.id === chat.id)
    const nextIndex = chats.value.length <= index + 1 ? index - 1 : index + 1
    console.log(chats.value.length, index, nextIndex)
    const newChatId = chats.value?.[nextIndex]?.id
    console.log('newChatId', newChatId)
    await db.chats.delete(chat.id)
    await db.messages.where('chatId').equals(chat.id).delete()
    await loadChats()

    if (newChatId !== Number(route.params.id)) {
      router.push(`/chat/${newChatId ?? ''}`)
    }
  }
}

const handleToggle = () => {
  isCollapsed.value = !isCollapsed.value
}

onMounted(() => {
  loadChats()
  emitter.on(Events.TOGGLE_SIDEBAR, handleToggle)
  emitter.on(Events.CHAT_CHANGE, loadChats)
})

onUnmounted(() => {
  emitter.off(Events.TOGGLE_SIDEBAR, handleToggle)
  emitter.off(Events.CHAT_CHANGE, loadChats)
})
</script>

<style scoped>
.chat-sidebar-wrapper {
  overflow: hidden;
}
.chat-sidebar {
  width: 240px;
  min-width: 240px;
}
</style>
