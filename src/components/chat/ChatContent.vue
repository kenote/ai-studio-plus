<template>
  <div class="chat-content h-full flex flex-col">
    <el-scrollbar class="flex-1 !overflow-y-auto !overflow-x-hidden w-full position-relative">
      <div
        class="position-absolute z-1 top-0 left-0 right-0 bottom-0 h-16 flex items-center justify-between bg-white dark:bg-[#1a1a1a]"
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
          <message-delta
            :type="msg.role"
            :content="msg.content"
            :createdAt="msg.createdAt!"
            :model-name="msg.modelFullName!"
            :is-thinking="isThinking === msg.id"
          />
        </div>
      </div>
    </el-scrollbar>
    <!-- 聊天区域 -->
    <div
      class="border-t min-h-[160px] max-w-4xl w-stretch border-zinc-200 dark:border-zinc-800 p-3"
    >
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
                  @click="loadImage(imageList)"
                >
                  <template #icon>
                    <el-icon class="!text-4"><Plus /></el-icon>
                  </template>
                </el-button>
              </el-tooltip>
            </div>
            <div class="mr-3 flex gap-2">
              <div class="w-[240px]">
                <ModelSelect
                  v-model="selectedModelId"
                  :model-groups="modelGroups"
                  @update:model-value="onModelChange"
                />
              </div>
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
                @click="imageList.splice(idx, 1)"
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
import { getModelFullName, getModelGroups } from '@/db/model'
import type { ModelGroup } from '@/types/provider'
import { emitter, Events } from '@/utils/emitter'
import { useChatStream } from '@/composables/useChatStream'
import { set } from 'lodash'
import { useRouter } from 'vue-router'
import { loadImage, getInputContent, getRequestConfig, type ImageFile } from '@/utils/message'
import { ElMessage } from 'element-plus'
import MessageDelta from './MessageDelta.vue'

const router = useRouter()

const props = defineProps<{
  chat: Chat | undefined
}>()

const emit = defineEmits<{
  'update:chat': [chat: Chat]
}>()

const modelGroups = ref<ModelGroup[]>([])
const messages = ref<Message[]>([])
const inputMessage = ref('')
const selectedModelId = ref<number>()
const imageList = ref<ImageFile[]>([])
const stream = ref<boolean>(true)
const isThinking = ref<number>(0)

const UPDATE_INTERVAL = 1500 // 每 300ms 存一次盘

/**
 * 发送请求
 */
const handleSend = async () => {
  // 采集用户输入
  const contents: (string | TextContent | ImageContent)[] = getInputContent(
    inputMessage.value,
    imageList.value,
  )
  // 判断是否空输入
  if (imageList.value.length > 0 && !contents.find((v) => (v as ContentItem).type === 'text')) {
    return
  }
  // 清除输入区
  clearValues()
  // 保存输入信息
  await updateMessage(
    {
      content: (() => {
        if (contents.length === 0) return ''
        if (contents.length === 1) {
          return contents[0] as string
        }
        return contents as ContentItem[]
      })(),
    },
    'user',
  )
  try {
    // 获取请求参数
    const options = await getRequestConfig(selectedModelId.value!, messages.value, stream.value)
    // 生成回复的信息ID
    const modelFullName = await getModelFullName(selectedModelId.value!)
    const assistantId = await updateMessage(
      { modelId: selectedModelId.value, modelFullName },
      'assistant',
    )
    console.log('assistantId', assistantId)
    // 发送聊天请求
    isThinking.value = assistantId!
    const delta = await useChatStream(options, '/chat/completions', streamCallback(assistantId!))
    // 处理非流式请求返回结果
    if (delta) {
      console.log('result:', delta)
      await updateMessage({ content: delta }, 'assistant', assistantId)
      isThinking.value = 0
    }
  } catch (error) {
    console.log(error)
    if (error instanceof Error) {
      ElMessage.warning(error.message)
    }
    isThinking.value = 0
  }
  scrollToBottom()
}

/**
 * 处理流式返回
 * @param assistantId
 */
const streamCallback = (assistantId: number) => {
  let longContent = ''
  let lastUpdateTime = 0
  return async (content: string, status: string) => {
    console.log(status, content)
    longContent += content

    // 1. 立即同步到 UI 内存（保证响应式跳动流畅）
    const target = messages.value.find((v) => v.id === assistantId)
    if (target) {
      target.content = longContent
    }

    // 2. 节流写入数据库（避免频繁 IO）
    const now = Date.now()
    if (status === 'stop' || now - lastUpdateTime > UPDATE_INTERVAL) {
      await updateMessage({ content: longContent }, 'assistant', assistantId)
      lastUpdateTime = now
      if (status === 'stop') {
        isThinking.value = 0
      }
      scrollToBottom()
    }
  }
}

/**
 * 更新对话记录
 */
const updateMessage = async (
  message: Partial<Message>,
  role: 'user' | 'assistant' | 'system',
  updateId?: number,
) => {
  const now = Date.now()
  let newMessage: Message = { role, content: '', createdAt: now }
  if (props.chat?.id) {
    newMessage = { ...newMessage, ...message, chatId: props.chat?.id }
    await db.chats.update(props.chat.id, { updatedAt: now, activeAt: now })
  } else {
    const chatId = await db.chats.add({
      modelId: selectedModelId.value!,
      providerId: 1,
      messages: [],
      createdAt: now,
      updatedAt: now,
      activeAt: now,
    })
    newMessage = { ...newMessage, ...message, chatId }
    const chat = await db.chats.get(chatId)
    emit('update:chat', chat!)
    router.replace(`/chat/${chatId}`)
  }
  let messageId = updateId
  if (updateId) {
    await db.messages.update(updateId, message)
    const updateMsg = messages.value.find((v) => v.id === updateId)!
    set(updateMsg, 'content', message.content as string)
    set(updateMsg, 'createdAt', now)
  } else {
    messageId = await db.messages.add(newMessage)
    messages.value.push({ ...newMessage, id: messageId })
  }
  scrollToBottom()
  return messageId
}

/**
 * 加载聊天信息
 */
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

/**
 * 清除输入信息
 */
const clearValues = () => {
  inputMessage.value = ''
  imageList.value = []
}

/**
 * 滚动到聊天底部
 */
const scrollToBottom = () => {
  setTimeout(() => {
    const el = document.querySelector('.chat-content .el-scrollbar__wrap')
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, 100)
}

const onModelChange = async (modelId: number) => {
  console.log(modelId)
  if (!props.chat?.id) return
}

watch(
  () => props.chat?.id,
  (value: number | undefined, oldValue: number | undefined) => {
    if (value === oldValue) return
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
