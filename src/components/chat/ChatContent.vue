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
            :model-groups="modelGroups"
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
                  :src="(item as ImageContent).image_url.url"
                  class="max-w-[200px] rounded"
                />
                <span v-else-if="item.type === 'text'">{{ (item as TextContent).text }}</span>
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
            @keydown.enter.prevent="handleSend"
          />
          <div class="h-8 p-[8px_2px] flex items-center justify-between">
            <div class="ml-3 flex gap-2">
              <el-tooltip content="上传图片" placement="top">
                <el-button
                  type="info"
                  circle
                  class="!rounded-1 !border-0 !bg-transparent hover:!bg-zinc-200 dark:hover:!bg-zinc-700 !c-black !dark:c-white"
                  @click="uploadImage"
                >
                  <template #icon>
                    <el-icon class="!text-4"><Plus /></el-icon>
                  </template>
                </el-button>
              </el-tooltip>
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
          <div
            v-if="imageList.length > 0"
            class="px-2 pb-2 flex gap-2 flex-wrap absolute -top-20 left-0 right-0"
          >
            <div v-for="(img, idx) in imageList" :key="idx" class="relative group">
              <img :src="img.url" class="w-16 h-16 object-cover rounded" />
              <button
                class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                @click="removeImage(idx)"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Chat, Message, ContentItem, TextContent, ImageContent } from '@/types/chat'
import { db } from '@/db'
import ModelSelect from './ModelSelect.vue'
import { Top, Plus } from '@element-plus/icons-vue'
import { getModelGroups } from '@/db/model'
import type { ModelGroup } from '@/types/provider'
import { emitter, Events } from '@/utils/emitter'

const props = defineProps<{
  chat: Chat | undefined
}>()

const emit = defineEmits<{
  'update:chat': [chat: Chat]
}>()

const messages = ref<Message[]>([])
const inputMessage = ref('')
const selectedModelId = ref<number>()
const imageList = ref<{ url: string; name: string }[]>([])
const modelGroups = ref<ModelGroup[]>([])

const uploadImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      imageList.value.push({ url, name: file.name })
    }
  }
  input.click()
}

const removeImage = (index: number) => {
  const img = imageList.value[index]
  if (img) {
    URL.revokeObjectURL(img.url)
    imageList.value.splice(index, 1)
  }
}

const handleSend = async () => {
  if (!inputMessage.value.trim() && imageList.value.length === 0) return
  if (!props.chat) return

  const contents: ContentItem[] = []

  if (imageList.value.length > 0) {
    for (const img of imageList.value) {
      contents.push({ type: 'image_url', image_url: { url: img.url } })
    }
  }

  if (inputMessage.value.trim()) {
    if (contents.length > 0) {
      for (const content of contents) {
        if (content.type === 'text') {
          contents.push({ type: 'text', text: inputMessage.value })
          break
        }
      }
      if (!contents.some((c) => c.type === 'text')) {
        contents.push({ type: 'text', text: inputMessage.value })
      }
    } else {
      contents.push({ type: 'text', text: inputMessage.value })
    }
  }

  const message: Message = {
    role: 'user',
    content:
      contents.length === 0
        ? ('' as string)
        : contents.length === 1
          ? (contents[0] as ContentItem)
          : (contents as ContentItem[]),
    createdAt: new Date(),
    provider: '',
  }

  await db.messages.add({ chatId: props.chat.id, ...message })
  messages.value.push({ ...message, chatId: props.chat.id } as Message)

  inputMessage.value = ''
  imageList.value = []
  scrollToBottom()
}

const loadMessages = async () => {
  if (!props.chat?.id) {
    messages.value = []
    selectedModelId.value = modelGroups.value[0]?.models[0]?.id
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

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

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

watch(
  () => props.chat?.id,
  () => {
    loadMessages()
  },
)

onMounted(async () => {
  modelGroups.value = await getModelGroups('chat')
  loadMessages()
  emitter.on(Events.DATA_CHANGE, async () => {
    modelGroups.value = await getModelGroups('chat')
    loadMessages()
  })
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
