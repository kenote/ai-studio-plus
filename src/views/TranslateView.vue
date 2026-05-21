<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Sort, Operation, Promotion, CopyDocument } from '@element-plus/icons-vue'
import type { ModelGroup } from '@/types/provider'
import { getModelGroups, getModelInfo } from '@/db/model'
import { emitter, Events } from '@/utils/emitter'
import ModelSelect from '@/components/chat/ModelSelect.vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import { useChatStream } from '@/composables/useChatStream'
import type { AIRequest } from '@/types/chat'
import type { InputInstance } from 'element-plus'
import NotSetting from '@/components/chat/NotSetting.vue'

const langs = [
  '🇨🇳 简体中文',
  '🇭🇰 繁体中文',
  '🇬🇧 英文',
  '🇯🇵 日文',
  '🇰🇷 韩文',
  '🇫🇷 法文',
  '🇩🇪 德文',
  '🇪🇸 西班牙文',
  '🇵🇹 葡萄牙文',
  '🇷🇺 俄文',
  '🇮🇳 印度文',
  '🇮🇩 印尼文',
  '🇹🇷 土耳其文',
  '🇸🇦 阿拉伯文',
  '🇻🇳 越南文',
  '🇹🇭 泰文',
  '🇮🇹 意大利文',
  '🇳🇱 荷兰文',
  '🇬🇷 希腊文',
  '🇺🇦 乌克兰文',
  '🇮🇱 希伯来文',
  '🇲🇾 马来文',
]

const sourceLang = ref<string>('自动检测')
const targetLang = ref<string>('🇬🇧 英文')
const style = ref<string>('')
const autoCopy = ref<boolean>(false)
const markdownPreview = ref<boolean>(true)
const showSettings = ref<boolean>(false)
const modelGroups = ref<ModelGroup[]>([])
const selectedModelId = ref<number>()
const inputContent = ref<string>('')
const outContent = ref<string>('')
const isThinking = ref<boolean>(false)
const outContentRef = ref<InputInstance | null>(null)

const renderedContent = computed(() => {
  if (!markdownPreview.value || !outContent.value) return ''
  return marked(outContent.value)
})

const UPDATE_INTERVAL = 1500 // 每 300ms 存一次盘

const exchangeLang = () => {
  if (sourceLang.value === '自动检测') {
    return
  }
  const temp = sourceLang.value
  sourceLang.value = targetLang.value
  targetLang.value = temp
}

const openSettings = () => {
  showSettings.value = true
}

const handleTranslate = async () => {
  const modelInfo = await getModelInfo(selectedModelId.value!)
  if (!modelInfo) {
    return
  }
  const systemContent =
    sourceLang.value === '自动检测'
      ? `你是一个专业翻译引擎。自动识别用户输入的语言，将其翻译为${targetLang.value}。` +
        (style.value ? '翻译风格：' + style.value + '。' : '') +
        '只输出翻译结果，不要解释、不要添加任何额外内容。如果输入语言与目标语言相同，则翻译为英语。'
      : `你是一个专业翻译引擎。将用户输入的${sourceLang.value}翻译为${targetLang.value}。` +
        (style.value ? '翻译风格：' + style.value + '。' : '') +
        '只输出翻译结果，不要解释、不要添加任何额外内容。'
  const options: AIRequest = {
    apiBase: modelInfo.apiBase,
    apiKey: modelInfo.apiKey,
    modelName: modelInfo.modelName,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: inputContent.value },
    ],
    stream: true,
  }
  isThinking.value = true
  try {
    const delta = await useChatStream(options, '/chat/completions', streamCallback())
    // 处理非流式请求返回结果
    if (delta) {
      outContent.value = delta
      isThinking.value = false
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.warning(error.message)
    }
  }
}

const copyResult = async () => {
  if (!outContent.value) return
  await navigator.clipboard.writeText(outContent.value)
  ElMessage.success('已复制到剪贴板')
}

const importFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.txt,.md,.text'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const text = await file.text()
      inputContent.value = text
    }
  }
  input.click()
}

const formatDate = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

const saveResult = () => {
  if (!outContent.value) return
  const timestamp = formatDate(new Date())
  const filename = `translate-${timestamp}.md`
  const blob = new Blob([outContent.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('译文已保存为 ' + filename)
}

const streamCallback = () => {
  outContent.value = ''
  let lastUpdateTime = 0
  return async (content: string, status: string) => {
    outContent.value += content
    scrollToBottom()

    // 2. 节流写入数据库（避免频繁 IO）
    const now = Date.now()
    if (status === 'stop' || now - lastUpdateTime > UPDATE_INTERVAL) {
      lastUpdateTime = now
      if (status === 'stop') {
        isThinking.value = false
        if (autoCopy.value && outContent.value) {
          await navigator.clipboard.writeText(outContent.value)
        }
      }
    }

    if (status === 'error') {
      isThinking.value = false
    }
  }
}

/**
 * 滚动到聊天底部
 */
const scrollToBottom = () => {
  setTimeout(() => {
    let el: HTMLElement | null = null
    if (markdownPreview.value) {
      el = document.querySelector('.translate-page .markdown-body')
    } else {
      el = outContentRef.value?.$el.querySelector('.el-textarea__inner')
    }
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, 100)
}

onMounted(async () => {
  modelGroups.value = await getModelGroups('chat')
  selectedModelId.value = modelGroups.value[0]?.models[0]?.id
  emitter.on(Events.DATA_CHANGE, async () => {
    modelGroups.value = await getModelGroups('chat')
    selectedModelId.value = modelGroups.value[0]?.models[0]?.id
  })
})

watch(
  () => inputContent.value,
  (newVal: string) => {
    if (newVal) return
    if (outContent.value) {
      outContent.value = ''
    }
  },
)
watch(
  () => markdownPreview.value,
  (newVal: boolean, oldVal: boolean) => {
    if (newVal === oldVal) return
    scrollToBottom()
  },
)
</script>

<template>
  <el-container v-if="selectedModelId" class="h-full">
    <el-header class="flex flex-row items-center justify-between">
      <div>
        <el-select v-model="sourceLang" placeholder="请选择" style="width: 150px" class="mr-4">
          <el-option label="自动检测" value="自动检测" />
          <el-option v-for="(lang, key) in langs" :key="key" :label="lang" :value="lang" />
        </el-select>
        <el-icon
          :class="[
            'rotate-90 mr-4 mt-4 !text-sm  !text-gray-500 ',
            sourceLang !== '自动检测'
              ? 'cursor-pointer hover:!text-zinc-700 dark:hover:!text-zinc-300'
              : '',
          ]"
          @click="exchangeLang"
          ><Sort
        /></el-icon>
        <el-select v-model="targetLang" placeholder="请选择" style="width: 150px" class="mr-4">
          <el-option v-for="(lang, key) in langs" :key="key" :label="lang" :value="lang" />
        </el-select>
        <el-button
          type="primary"
          :icon="Promotion"
          :disabled="!inputContent"
          @click="handleTranslate"
          :loading="isThinking"
          >翻译</el-button
        >
        <el-button type="info" @click="importFile" dashed :disabled="isThinking"
          >导入文件</el-button
        >
        <el-button type="success" dashed :disabled="isThinking || !outContent" @click="saveResult"
          >保存译文</el-button
        >
      </div>
      <div class="w-[300px] flex flex-row items-center justify-end mt-2">
        <div class="w-[200px]">
          <ModelSelect
            v-model="selectedModelId"
            :model-groups="modelGroups"
            placement="bottom-end"
          />
        </div>
        <el-icon
          @click="openSettings"
          class="ml-4 mr-2 cursor-pointer !text-base !text-gray-500 hover:!text-zinc-700 dark:hover:!text-zinc-300"
          ><Operation
        /></el-icon>
      </div>
    </el-header>
    <el-main class="!flex !pt-2 translate-page">
      <div class="w-[50%] mr-2">
        <el-input
          v-model="inputContent"
          placeholder="需要翻译的文字"
          type="textarea"
          resize="none"
          class="h-full"
          :show-word-limit="true"
          maxlength="10000"
          clearable
          :disabled="isThinking"
        />
      </div>
      <div class="w-[50%] ml-2 !relative">
        <div
          v-if="markdownPreview && outContent"
          class="markdown-body h-stretch overflow-auto p-4 bg-white dark:bg-zinc-900 border-solid border-1 border-gray-200 dark:border-zinc-700 rounded"
          v-html="renderedContent"
        ></div>
        <el-input
          v-else
          ref="outContentRef"
          v-model="outContent"
          :placeholder="isThinking ? '正在翻译...' : '译文'"
          type="textarea"
          resize="none"
          class="h-full"
          readonly
        />
        <el-icon
          v-show="outContent && !isThinking"
          @click="copyResult"
          :class="[
            '!absolute top-4 right-4 !text-base  !text-gray-500 ',
            outContent ? 'cursor-pointer hover:!text-zinc-700 dark:hover:!text-zinc-300' : '',
          ]"
        >
          <CopyDocument />
        </el-icon>
      </div>
    </el-main>
    <el-dialog v-model="showSettings" title="翻译设置" width="500px">
      <div class="py-1 flex flex-row items-center justify-between">
        <div class="text-sm text-zinc-600 dark:text-zinc-400">Markdown预览</div>
        <el-switch v-model="markdownPreview" />
      </div>
      <div class="py-2 flex flex-row items-center justify-between">
        <div class="text-sm text-zinc-600 dark:text-zinc-400">自动复制</div>
        <el-switch v-model="autoCopy" />
      </div>
      <div class="py-2 flex flex-row items-center justify-between mb-2">
        <div class="text-sm text-zinc-600 dark:text-zinc-400">翻译风格</div>
        <el-radio-group v-model="style" class="flex flex-wrap">
          <el-radio-button value="">默认</el-radio-button>
          <el-radio-button value="正式">正式</el-radio-button>
          <el-radio-button value="口语化">口语化</el-radio-button>
          <el-radio-button value="技术文档">技术文档</el-radio-button>
          <el-radio-button value="文学">文学</el-radio-button>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSettings = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-container>
  <not-setting v-else />
</template>

<style scoped>
.translate-page {
  display: flex;
  /* flex-direction: column; */
  padding-top: 0.5rem !important;
}
.translate-page :deep(.el-textarea__inner) {
  font-size: 16px !important;
  font-family:
    '',
    Ubuntu,
    -apple-system,
    'system-ui',
    'Segoe UI',
    system-ui,
    Roboto,
    Oxygen,
    Cantarell,
    'Open Sans',
    'Helvetica Neue',
    Arial,
    'Noto Sans',
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji';
  height: 100% !important;
}
.translate-page :deep(.el-textarea__clear) {
  font-size: 20px !important;
  margin-top: 6px !important;
}
</style>
