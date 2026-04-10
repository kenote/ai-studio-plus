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
        <span class="text-base font-medium">历史会话</span>
        <!-- <button
          @click="createChat"
          class="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          title="新建会话"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button> -->
      </div>
      <el-scrollbar class="flex-1">
        <div class="p-2 space-y-1">
          <div
            v-for="chat in chats"
            :key="chat.id"
            class="group flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
            :class="activeChatId === chat.id ? 'bg-zinc-200 dark:bg-zinc-700' : ''"
            @click="selectChat(chat)"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">{{ chat.title || '新会话' }}</div>
              <div class="text-xs text-zinc-500 truncate">
                {{ formatDate(chat.updatedAt) }}
              </div>
            </div>
            <button
              v-if="activeChatId !== chat.id"
              @click.stop="deleteChat(chat)"
              class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
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
          </div>
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
import { db } from '@/db'
import type { Chat } from '@/types/chat'
import { emitter, Events } from '@/utils/emitter'

defineProps<{
  activeChatId?: number
}>()

const emit = defineEmits<{
  select: [chat: Chat]
  create: []
}>()

const isCollapsed = ref(false)
const chats = ref<Chat[]>([])

const loadChats = async () => {
  chats.value = await db.chats.orderBy('updatedAt').reverse().toArray()
}

// const createChat = () => {
//   emit('create')
// }

const selectChat = (chat: Chat) => {
  emit('select', chat)
}

const deleteChat = async (chat: Chat) => {
  if (chat.id) {
    await db.chats.delete(chat.id)
    await db.messages.where('chatId').equals(chat.id).delete()
    await loadChats()
    emitter.emit(Events.DATA_CHANGE)
  }
}

const formatDate = (date: Date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return d.toLocaleDateString('zh-CN', { weekday: 'short' })
  } else {
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

const handleToggle = () => {
  isCollapsed.value = !isCollapsed.value
}

onMounted(() => {
  loadChats()
  emitter.on(Events.TOGGLE_SIDEBAR, handleToggle)
})

onUnmounted(() => {
  emitter.off(Events.TOGGLE_SIDEBAR, handleToggle)
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
