<template>
  <div class="chat-content h-full flex flex-col">
    <el-scrollbar class="flex-1 !overflow-y-auto !overflow-x-hidden w-full position-relative">
      <div
        class="position-absolute top-0 left-0 right-0 bottom-0 h-16 flex items-center justify-between"
      >
        <div></div>
        <div></div>
        <div class="w-[260px] pr-6">
          <ModelSelect
            v-model="selectedModelId"
            model-type="chat"
            @update:model-value="onModelChange"
          />
        </div>
      </div>
      <div class="p-4 space-y-4 max-w-4xl mx-auto">
        <div v-if="messages.length === 0" class="text-center text-zinc-400 text-sm py-8">
          开始新对话吧
        </div>
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="flex gap-3"
          :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
            :class="msg.role === 'user' ? 'bg-blue-500' : 'bg-zinc-600'"
          >
            {{ msg.role === 'user' ? '用户' : 'AI' }}
          </div>
          <div
            class="max-w-[80%] rounded-lg px-4 py-2 text-sm"
            :class="msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'"
          >
            <div v-if="Array.isArray(msg.content)">
              <template v-for="(item, i) in msg.content" :key="i">
                <img
                  v-if="item.type === 'image_url'"
                  :src="item.image_url.url"
                  class="max-w-[200px] rounded"
                />
                <span v-else>{{ item.text }}</span>
              </template>
            </div>
            <div v-else>{{ msg.content }}</div>
            <div class="text-xs opacity-60 mt-1">
              {{ msg.provider }} · {{ formatTime(msg.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <!-- 聊天区域 -->
    <div class="border-t min-h-[160px] w-4xl border-zinc-200 dark:border-zinc-800 p-3">
      <div class="mx-auto max-w-4xl relative">
        <div
          class="border border-zinc-200 dark:border-zinc-800 border-solid rounded-xl p-[8px_2px] bg-coolgray-50 dark:bg-zinc-800"
        >
          <el-input
            type="textarea"
            v-model="inputMessage"
            resize="none"
            :autosize="{ minRows: 3, maxRows: 3 }"
            placeholder="输入消息内容..."
            @keydown.enter.prevent="handleEnd"
          />
          <div class="h-8 p-[8px_2px] flex items-center justify-between">
            <div class="ml-3">
              <el-button
                type="info"
                circle
                class="!rounded-1 !border-0 !bg-transparent hover:!bg-zinc-200 dark:hover:!bg-zinc-700 !c-black !dark:c-white"
              >
                <template #icon>
                  <el-icon class="!text-4"><Plus /></el-icon>
                </template>
              </el-button>
            </div>
            <div class="mr-3">
              <el-button
                type="info"
                :icon="Top"
                :disabled="!inputMessage.trim()"
                circle
                class="!rounded-1 dark:!bg-zinc-600 dark:hover:!bg-zinc-700 !border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Chat, Message } from '@/types/chat'
import { db } from '@/db'
import ModelSelect from './ModelSelect.vue'
import { Top, Plus } from '@element-plus/icons-vue'

const props = defineProps<{
  chat: Chat | undefined
}>()

const emit = defineEmits<{
  'update:chat': [chat: Chat]
}>()

const messages = ref<Message[]>([])
const inputMessage = ref('')
const selectedModelId = ref<number>()

const onModelChange = async (modelId: number) => {
  if (!props.chat) return
  const chat = await db.chats.get(props.chat.id)
  if (!chat) return
  const model = await db.models.get(modelId)
  if (!model || !model.providerId) return
  await db.chats.update(props.chat.id, { modelId, providerId: model.providerId })
  const updatedChat = { ...chat, modelId, providerId: model.providerId }
  emit('update:chat', updatedChat)
}

const loadModels = async () => {
  const models = (await db.models.toArray()).filter((m) => m.type?.includes('chat'))
  console.log(selectedModelId)
  if (!selectedModelId.value) {
    selectedModelId.value = models[0]?.id
  }
}

const loadMessages = async () => {
  if (!props.chat?.id) {
    messages.value = []
    return
  }
  const msgs = await db.messages.where('chatId').equals(props.chat.id).sortBy('createdAt')
  messages.value = msgs ?? []
  selectedModelId.value = props.chat.modelId
  scrollToBottom()
}

const scrollToBottom = () => {
  setTimeout(() => {
    const el = document.querySelector('.chat-content .el-scrollbar__wrap')
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, 100)
}

const handleEnd = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.shiftKey) {
    inputMessage.value += '\n'
    return
  }
  // console.log('发送消息:', inputMessage.value)
  const message: Partial<Message> = {
    role: 'user',
    content: inputMessage.value,
  }
  console.log('新消息对象:', message)
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

watch(
  () => props.chat?.id,
  () => {
    loadMessages()
  },
)

onMounted(() => {
  loadModels()
  loadMessages()
})
</script>

<style scoped>
.chat-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.chat-content :deep(.el-textarea__inner) {
  font-size: 16px;
  background: transparent;
  border: none;
  resize: none;
  box-shadow: none;
}
.chat-content :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}
</style>
