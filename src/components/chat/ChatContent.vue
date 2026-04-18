<template>
  <div class="chat-content h-full flex flex-col">
    <el-scrollbar class="flex-1 !overflow-y-auto !overflow-x-hidden w-full position-relative">
      <div
        class="position-absolute top-0 left-0 right-0 bottom-0 h-16 flex items-center justify-between bg-white dark:bg-[#1a1a1a]"
      >
        <div></div>
        <div>新会话</div>
        <div class="w-[260px] pr-6">
          <!-- <ModelSelect
            v-model="selectedModelId"
            :model-groups="modelGroups"
            @update:model-value="onModelChange"
          /> -->
        </div>
      </div>
      <div class="p-4 space-y-4 max-w-4xl mx-auto mt-20">
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
              {{ msg.modelFullName }} · {{ formatTime(msg.createdAt!) }}
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
              <div class="w-[260px]">
                <ModelSelect
                  v-model="selectedModelId"
                  :model-groups="modelGroups"
                  @update:model-value="onModelChange"
                />
              </div>
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
                @click="handleSend"
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
import type { Chat, Message, ContentItem, TextContent, ImageContent, AIRequest } from '@/types/chat'
import { db } from '@/db'
import ModelSelect from './ModelSelect.vue'
import { Top, Plus } from '@element-plus/icons-vue'
import { getModelFullName, getModelGroups, getModelInfo } from '@/db/model'
import type { ModelGroup } from '@/types/provider'
import { emitter, Events } from '@/utils/emitter'
import { useChatStream } from '@/composables/useChatStream'
import { pick, set } from 'lodash'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  chat: Chat | undefined
}>()

const emit = defineEmits<{
  'update:chat': [chat: Chat]
}>()

// const { content, isTyping, error, fetchStream } = useChatStream()
const modelGroups = ref<ModelGroup[]>([])
// const talk = ref<Chat>()
const messages = ref<Message[]>([])
const inputMessage = ref('')
const selectedModelId = ref<number>()
const imageList = ref<{ url: string; name: string; base64: string }[]>([])
const streamContent = ref('')

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const uploadImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const base64 = await fileToBase64(file)
      imageList.value.push({ url: base64, name: file.name, base64 })
    }
  }
  input.click()
}

const removeImage = (index: number) => {
  imageList.value.splice(index, 1)
}

/** 获取提交的消息 */
const getInputMessage = () => {
  const contents: (string | TextContent | ImageContent)[] = []
  // 处理上传图片
  if (imageList.value.length > 0) {
    for (const img of imageList.value) {
      contents.push({ type: 'image_url', image_url: { url: img.base64 } })
    }
  }
  // 处理文字消息
  if (inputMessage.value.trim()) {
    const text = inputMessage.value.trim()
    if (contents.length === 0) {
      // 1. 数组为空，直接 push 字符串
      contents.push(text)
    } else {
      // 2. 数组不为空，查找是否存在 type 为 'text' 的对象
      const textItem = contents.find(
        (c): c is TextContent => typeof c !== 'string' && c.type === 'text',
      )
      if (textItem) {
        // 存在对象则更新
        textItem.text = text
      } else {
        // 不存在对象则追加一个新对象
        contents.push({ type: 'text', text: text })
      }
    }
  }
  inputMessage.value = ''
  imageList.value = []
  return contents
}

const handleSend = async () => {
  if (!inputMessage.value.trim() && imageList.value.length === 0) return
  // if (!props.chat) return

  const contents: (string | TextContent | ImageContent)[] = getInputMessage()

  const message: Partial<Message> = {
    content: (() => {
      if (contents.length === 0) return ''
      if (contents.length === 1) {
        return contents[0] as string
      }
      return contents as ContentItem[]
    })(),
  }
  await updateMessage(message, 'user')

  console.log(message)
  // 设置
  const stream = true
  try {
    const modelInfo = (await getModelInfo(selectedModelId.value!))!
    const modelFullName = await getModelFullName(selectedModelId.value!)
    const options: AIRequest = {
      ...modelInfo,
      messages: messages.value.map((v) => pick(v, ['role', 'content'])),
      stream,
    }
    streamContent.value = ''
    let longContent = ''
    let lastUpdateTime = 0
    const UPDATE_INTERVAL = 1500 // 每 300ms 存一次盘
    // if (stream) {
    await updateMessage({ modelId: selectedModelId.value, modelFullName }, 'assistant')
    const assistant = await db.messages
      .where('chatId')
      .equals(props.chat?.id ?? 0)
      .last()
    console.log(assistant)
    const delta = await useChatStream(
      options,
      '/chat/completions',
      async (content: string, status: string) => {
        console.log(status, content)
        longContent += content

        // 1. 立即同步到 UI 内存（保证响应式跳动流畅）
        const target = messages.value.find((v) => v.id === assistant?.id)
        if (target) {
          target.content = longContent
        }

        // 2. 节流写入数据库（避免频繁 IO）
        const now = Date.now()
        if (status === 'stop' || now - lastUpdateTime > UPDATE_INTERVAL) {
          await updateMessage({ content: longContent }, 'assistant', assistant?.id)
          lastUpdateTime = now
        }
      },
    )
    if (delta) {
      console.log('result:', delta)
    }
  } catch (error) {
    console.log(error)
  }
  // const modelInfo = (await getModelInfo(selectedModelId.value!))!
  // const options: AIRequest = { ...modelInfo, messages: messages.value }
  // await fetchStream(options, '/chat/completions')
  // await db.messages.add({ chatId: props.chat.id, ...message })
  // messages.value.push({ ...message, chatId: props.chat.id } as Message)

  scrollToBottom()
}

/** 更新对话记录 */
const updateMessage = async (
  message: Partial<Message>,
  role: 'user' | 'assistant' | 'system',
  updateid?: number,
) => {
  let newMessage: Message = { role, content: '', createdAt: Date.now() }
  if (props.chat?.id) {
    newMessage = { ...newMessage, ...message, chatId: props.chat?.id }
  } else {
    const chatId = await db.chats.add({
      modelId: selectedModelId.value!,
      providerId: 1,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeAt: Date.now(),
    })
    newMessage = { ...newMessage, ...message, chatId }
    const chat = await db.chats.get(chatId)
    emit('update:chat', chat!)
    router.replace(`/chat/${chatId}`)
  }
  if (updateid) {
    await db.messages.update(updateid, message)
    set(messages.value.find((v) => v.id === updateid)!, 'content', message.content as string)
  } else {
    const id = await db.messages.add(newMessage)
    messages.value.push({ ...newMessage, id })
  }
  scrollToBottom()
}

const loadMessages = async () => {
  if (!props.chat?.id) {
    selectedModelId.value = modelGroups.value[0]?.models[0]?.id
    messages.value = []
    clearValues()
    return
  }
  selectedModelId.value = props.chat.modelId
  messages.value = await db.messages.where('chatId').equals(props.chat?.id).sortBy('id')
  scrollToBottom()
}

const clearValues = () => {
  inputMessage.value = ''
  imageList.value = []
}

const scrollToBottom = () => {
  setTimeout(() => {
    const el = document.querySelector('.chat-content .el-scrollbar__wrap')
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, 100)
}

const formatTime = (date: number) => {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const onModelChange = async (modelId: number) => {
  console.log(modelId)
  if (!props.chat?.id) return
}

watch(
  () => props.chat?.id,
  (value: number | undefined, oldValue: number | undefined) => {
    if (value === oldValue) return
    console.log(value)
    // router.replace(`/chat/${value}`)
    loadMessages()
  },
)

onMounted(async () => {
  // router.replace(`/chat/${props.chat?.id ?? ''}`)
  modelGroups.value = await getModelGroups('chat')
  loadMessages()
  emitter.on(Events.DATA_CHANGE, async () => {
    modelGroups.value = await getModelGroups('chat')
    loadMessages()
  })
  scrollToBottom()
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
