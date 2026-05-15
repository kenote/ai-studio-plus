<template>
  <div class="chat-content h-full flex flex-col !overflow-x-auto min-w-3xl">
    <el-scrollbar
      ref="scrollbarRef"
      class="flex-1 !overflow-y-auto !overflow-x-hidden w-full position-relative"
      @scroll="handleScroll"
    >
      <div
        class="position-absolute z-1 top-0 left-0 right-0 bottom-0 h-16 flex items-center justify-between bg-white dark:bg-[#1a1a1a]"
      >
        <div class="w-[100px] pl-6 text-xs text-zinc-400 truncate outline-none">
          {{ assistants.find((a) => a.id === chat?.assistantId)?.name || '' }}
        </div>
        <div
          v-if="chat?.id"
          class="truncate font-500 text-[18px] max-w-2xl cursor-text border border-transparent hover:border-blue-400 px-2 py-0.5 rounded outline-none"
          contenteditable="true"
          @blur="handleNameBlur"
          @keydown.enter.prevent="handleNameBlur"
          @keydown.escape="handleNameCancel"
        >
          {{ chatName }}
        </div>

        <div class="w-[100px] pr-6 flex flex-row-reverse" v-if="chat?.id">
          <el-popover
            placement="bottom-end"
            :width="320"
            trigger="click"
            v-if="messages.filter((v) => v.role === 'user').length > 0"
          >
            <template #reference>
              <el-icon class="cursor-pointer text-zinc-500 hover:text-zinc-700 mr-4"
                ><Document
              /></el-icon>
            </template>
            <div class="max-h-[400px] overflow-y-auto">
              <div class="text-xs text-zinc-400 mb-2 px-2">消息大纲</div>
              <template v-for="(msg, index) in messages">
                <div
                  v-if="msg.role === 'user'"
                  :key="index"
                  class="text-sm px-2 py-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded truncate"
                  :class="msg.role === 'user' ? 'text-left' : 'text-right text-zinc-400'"
                  @click="scrollToMessage(index)"
                >
                  <span>{{ getMessageSummary(msg.content) }}</span>
                </div>
              </template>
              <div v-if="messages.length === 0" class="text-center text-zinc-400 text-sm py-4">
                暂无消息
              </div>
            </div>
          </el-popover>
        </div>

        <div class="pr-6 flex items-center" v-else>
          <el-dropdown
            v-if="assistants.length > 0"
            ref="assistantDropdownRef"
            trigger="click"
            placement="bottom-end"
            @command="handleAssistantCommand"
          >
            <span class="el-dropdown-link">
              {{ selectedAssistantName }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <div class="p-2 w-64">
                <div
                  class="p-3 mb-2 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  :class="
                    !selectedAssistantId ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
                  "
                  @click="handleAssistantCommand(undefined)"
                >
                  <div class="font-medium text-zinc-400">不使用助手</div>
                </div>
                <div
                  v-for="assistant in assistants"
                  :key="assistant.id"
                  class="p-3 mb-2 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  :class="
                    selectedAssistantId === assistant.id
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  "
                  @click="handleAssistantCommand(assistant.id!)"
                >
                  <div class="font-medium">{{ assistant.name || '' }}</div>
                  <div v-if="assistant.content" class="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {{ assistant.content }}
                  </div>
                </div>
              </div>
            </template>
          </el-dropdown>
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
            :open-search="openSearch"
            :archive="archive"
            :joplin="joplinConfig"
            :msg-id="msg.id"
            :error="msg.error"
            @resend="handleResend"
          />
        </div>
      </div>
    </el-scrollbar>
    <!-- 聊天区域 -->
    <div
      class="border-t min-h-[160px] max-w-4xl w-stretch border-zinc-200 dark:border-zinc-800 p-3"
    >
      <div class="mx-auto max-w-4xl relative">
        <el-button
          v-show="showScrollButton"
          type="info"
          :icon="Bottom"
          circle
          dashed
          class="!rounded-1 dark:!bg-zinc-600 dark:hover:!bg-zinc-700 !border-0 absolute top-[-40px] left-[50%]"
          @click="scrollToBottom"
        />
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

              <el-check-tag
                :checked="openSearch"
                class="!px-[8px] !py-[7px] !text-[18px] !bg-transparent hover:!bg-zinc-200 dark:hover:!bg-zinc-700"
                @change="openSearch = !openSearch"
                ><el-icon><ChromeFilled /></el-icon
              ></el-check-tag>
            </div>
            <div class="mr-3 flex gap-2">
              <div class="w-[200px]">
                <ModelSelect v-model="selectedModelId" :model-groups="modelGroups" />
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
import { ref, computed, onMounted, watch } from 'vue'
import type { Chat, Message, ContentItem, TextContent, ImageContent, Assistant } from '@/types/chat'
import { db } from '@/db'
import ModelSelect from './ModelSelect.vue'
import { Top, Plus, Document, Bottom, ArrowDown, ChromeFilled } from '@element-plus/icons-vue'
import { getModelFullName, getModelGroups } from '@/db/model'
import type { ModelGroup } from '@/types/provider'
import { emitter, Events } from '@/utils/emitter'
import { useChatStream } from '@/composables/useChatStream'
import { set, cloneDeep } from 'lodash-es'
import { useRouter } from 'vue-router'
import {
  loadImage,
  getInputContent,
  getRequestConfig,
  getSearchContent,
  type ImageFile,
} from '@/utils/message'
import MessageDelta from './MessageDelta.vue'
import { getChatName } from '@/db/chat'

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
const selectedAssistantId = ref<number>()
const assistants = ref<Assistant[]>([])

const selectedAssistantName = computed(() => {
  if (!selectedAssistantId.value) return '不使用助手'
  const assistant = assistants.value.find((a) => a.id === selectedAssistantId.value)
  return assistant?.name || '不使用助手'
})

const handleAssistantCommand = (command: number | undefined) => {
  selectedAssistantId.value = command
  assistantDropdownRef.value?.handleClose()
  if (command) {
    const assistant = assistants.value.find((a) => a.id === command)
    messages.value = [
      {
        role: 'system',
        content: assistant?.content || '',
      },
    ]
    ElMessage.success(`已选择助手：${assistant?.name}`)
  } else {
    messages.value = []
    ElMessage.success('已取消助手')
  }
}
const imageList = ref<ImageFile[]>([])
const stream = ref<boolean>(true)
const isThinking = ref<number>(0)
const chatName = ref('')
const openSearch = ref<boolean>(false)
const joplinConfig = ref<{
  host?: string
  token: string
  folder?: string
}>()
const showScrollButton = ref(false)
const scrollbarRef = ref()
const assistantDropdownRef = ref()
const archive = ref<boolean>(false)

const UPDATE_INTERVAL = 1500 // 每 300ms 存一次盘

const handleNameBlur = async (evt: FocusEvent) => {
  try {
    const target = evt.target as HTMLElement
    if (!target) return
    const newTitle = target.innerText?.trim() || ''
    if (newTitle && newTitle !== chatName.value) {
      const chatId = props.chat?.id
      if (chatId) {
        await db.chats.update(chatId, { title: newTitle })
        chatName.value = newTitle
        emitter.emit(Events.CHAT_CHANGE)
      }
    } else if (!newTitle) {
      target.innerText = chatName.value
    }
  } catch {
    // ignore
  }
}

const handleNameCancel = (evt: KeyboardEvent) => {
  try {
    const target = evt.target as HTMLElement
    if (!target) return
    target.innerText = chatName.value
  } catch {
    // ignore
  }
}

const handleScroll = () => {
  const wrap = scrollbarRef.value?.$el?.querySelector('.el-scrollbar__wrap')
  if (!wrap) return
  const distanceToBottom = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight
  showScrollButton.value = distanceToBottom > 400
}

const getMessageSummary = (content: string | ImageContent | ContentItem[]): string => {
  if (typeof content === 'string') {
    return content.slice(0, 50)
  }
  if (Array.isArray(content)) {
    const textItem = content.find((item) => item.type === 'text')
    return textItem ? (textItem as { type: string; text: string }).text.slice(0, 50) : '图片消息'
  }
  if ((content as { type: string }).type === 'image_url') {
    return '图片消息'
  }
  return ''
}

const scrollToMessage = (index: number) => {
  const msgId = messages.value[index]?.id
  if (msgId) {
    const el = document.getElementById(`msg-${msgId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

const handleResend = (msgId: number) => {
  const index = messages.value.findIndex((v) => v.id === msgId)
  const assistantMsg = messages.value[index + 1]!
  set(assistantMsg, 'content', '')
  set(assistantMsg, 'error', undefined)
  sendMessage(assistantMsg.id)
}

/**
 * 发送请求
 */
const handleSend = async (evt?: Event | KeyboardEvent) => {
  if (evt && 'key' in evt) {
    if (evt.shiftKey || evt.ctrlKey) {
      inputMessage.value += '\n'
      return
    }
  }
  if (!inputMessage.value.trim() && imageList.value.length === 0) return
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
  chatName.value = (await getChatName(props.chat!))!
  await sendMessage()
}

/**
 * 发送消息; 可以赋ID
 * @param id
 */
const sendMessage = async (id?: number) => {
  let assistantId = id
  try {
    const index = id ? messages.value.findIndex((item) => item.id === id) : -1
    const msgs = cloneDeep(id ? messages.value.slice(0, index) : messages.value)
    // 联网搜索
    await getSearchContent(msgs, openSearch.value)
    // 获取请求参数
    const options = await getRequestConfig(selectedModelId.value!, msgs, stream.value)
    // 生成回复的信息ID
    if (!id) {
      const modelFullName = await getModelFullName(selectedModelId.value!)
      assistantId = await updateMessage(
        { modelId: selectedModelId.value, modelFullName },
        'assistant',
      )
    }
    // 发送聊天请求
    isThinking.value = assistantId!
    const delta = await useChatStream(options, '/chat/completions', streamCallback(assistantId!))
    // 处理非流式请求返回结果
    if (delta) {
      await updateMessage({ content: delta, error: undefined }, 'assistant', assistantId)
      isThinking.value = 0
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.warning(error.message)
      await updateMessage({ error, content: '' }, 'assistant', assistantId)
    }
    isThinking.value = 0
  }
  // scrollToBottom()
}

/**
 * 处理流式返回
 * @param assistantId
 */
const streamCallback = (assistantId: number) => {
  let longContent = ''
  let lastUpdateTime = 0
  return async (content: string, status: string) => {
    longContent += content

    // 1. 立即同步到 UI 内存（保证响应式跳动流畅）
    const target = messages.value.find((v) => v.id === assistantId)
    if (target) {
      target.content = longContent
    }

    // 2. 节流写入数据库（避免频繁 IO）
    const now = Date.now()
    if (status === 'stop' || now - lastUpdateTime > UPDATE_INTERVAL) {
      await updateMessage({ content: longContent, error: undefined }, 'assistant', assistantId)
      lastUpdateTime = now
      if (status === 'stop') {
        isThinking.value = 0
      }
      // scrollToBottom()
    }

    if (status === 'error') {
      await updateMessage({ error: new Error(longContent) }, 'assistant', assistantId)
      isThinking.value = 0
      // scrollToBottom()
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
      assistantId: selectedAssistantId.value,
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
    const assistant = assistants.value.find((a) => a.id === selectedAssistantId.value)
    const systemMessage = await db.messages
      .where('chatId')
      .equals(newMessage.chatId!)
      .filter((m) => m.role === 'system')
      .first()
    if (assistant && !systemMessage) {
      await db.messages.add({
        role: 'system',
        content: assistant.content || '',
        createdAt: now,
        chatId: newMessage.chatId,
      })
    }
    if (assistant && messages.value.find((v) => v.role === 'system') === undefined) {
      messages.value.unshift({
        role: 'system',
        content: assistant.content || '',
      })
    }
    messageId = await db.messages.add(newMessage)
    messages.value.push({ ...newMessage, id: messageId })
  }
  scrollToAssistant(messageId!)
  return messageId
}

/**
 * 加载聊天信息
 */
const loadMessages = async () => {
  const config = await db.config.get(1)
  // openSearch.value = config?.search?.open || false
  joplinConfig.value = config?.joplin
  archive.value = config?.archive || false
  chatName.value = (await getChatName(props.chat!))!
  if (!props.chat?.id) {
    selectedModelId.value = modelGroups.value[0]?.models[0]?.id
    messages.value = []
    clearValues()
    return
  }
  selectedModelId.value = props.chat.modelId
  messages.value = await db.messages.where('chatId').equals(props.chat?.id).sortBy('id')
  // openSearch.value = false
  // scrollToBottom()
  clearValues()
  // if (!last(messages.value.filter((v) => v.role === 'assistant'))?.content) {
  //   // 检查上次未完成请求
  //   await sendMessage(last(messages.value)?.id)
  // }
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
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, 100)
}

/**
 * 滚动到指定消息位置
 * @param id
 */
const scrollToAssistant = (id: number) => {
  setTimeout(() => {
    const el = document.querySelector(`.chat-content #msg-${id}`)
    if (el) {
      el.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }, 100)
}

watch(
  () => props.chat?.id,
  (value: number | undefined, oldValue: number | undefined) => {
    if (value === oldValue) return
    loadMessages()
    scrollToBottom()
    if (!value) {
      openSearch.value = false
    }
  },
)
watch(
  () => props.chat?.title,
  async (value: string | undefined, oldValue: string | undefined) => {
    if (value === oldValue) return
    chatName.value = (await getChatName(props.chat!))!
  },
)

onMounted(async () => {
  modelGroups.value = await getModelGroups('chat')
  assistants.value = await db.assistant.toArray()
  loadMessages()
  emitter.on(Events.DATA_CHANGE, async () => {
    modelGroups.value = await getModelGroups('chat')
    assistants.value = await db.assistant.toArray()
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
