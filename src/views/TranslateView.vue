<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sort, Operation, Promotion } from '@element-plus/icons-vue'
import type { ModelGroup } from '@/types/provider'
import { getModelGroups, getModelInfo } from '@/db/model'
import { emitter, Events } from '@/utils/emitter'
import ModelSelect from '@/components/chat/ModelSelect.vue'
import { useChatStream } from '@/composables/useChatStream'
import type { AIRequest } from '@/types/chat'

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
const modelGroups = ref<ModelGroup[]>([])
const selectedModelId = ref<number>()
const inputContent = ref<string>('')
const outContent = ref<string>('')
const isThinking = ref<boolean>(false)

const UPDATE_INTERVAL = 1500 // 每 300ms 存一次盘

const exchangeLang = () => {
  if (sourceLang.value === '自动检测') {
    return
  }
  const temp = sourceLang.value
  sourceLang.value = targetLang.value
  targetLang.value = temp
}

const handleTranslate = async () => {
  // TODO
  const modelInfo = await getModelInfo(selectedModelId.value!)
  if (!modelInfo) {
    return
  }
  const systemContent =
    sourceLang.value === '自动检测'
      ? `你是一个专业翻译引擎。自动识别用户输入的语言，将其翻译为${targetLang.value}。只输出翻译结果，不要解释、不要添加任何额外内容。如果输入语言与目标语言相同，则翻译为英语。`
      : `你是一个专业翻译引擎。将用户输入的${sourceLang.value}翻译为${targetLang.value}。只输出翻译结果，不要解释、不要添加任何额外内容。`
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
  console.log('translate options', options)
  isThinking.value = true
  try {
    // const response = await useTranslate(
    //   inputContent.value,
    //   targetLang.value,
    //   sourceLang.value === '自动检测' ? undefined : sourceLang.value,
    // )(modelInfo)
    // // outContent.value = response
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

const streamCallback = () => {
  outContent.value = ''
  let lastUpdateTime = 0
  return async (content: string, status: string) => {
    outContent.value += content

    // 2. 节流写入数据库（避免频繁 IO）
    const now = Date.now()
    if (status === 'stop' || now - lastUpdateTime > UPDATE_INTERVAL) {
      lastUpdateTime = now
      if (status === 'stop') {
        isThinking.value = false
      }
    }

    if (status === 'error') {
      isThinking.value = false
    }
  }
}

onMounted(async () => {
  modelGroups.value = await getModelGroups('chat')
  selectedModelId.value = modelGroups.value[0]?.models[0]?.id
  emitter.on(Events.DATA_CHANGE, async () => {
    modelGroups.value = await getModelGroups('chat')
    selectedModelId.value = modelGroups.value[0]?.models[0]?.id
  })
})
</script>

<template>
  <el-container class="h-full">
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
      </div>
      <div class="w-[300px] flex flex-row items-center justify-end">
        <div class="w-[200px]">
          <ModelSelect
            v-model="selectedModelId"
            :model-groups="modelGroups"
            placement="bottom-end"
          />
        </div>
        <el-icon
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
          maxlength="5000"
          clearable
        />
      </div>
      <div class="w-[50%] ml-2">
        <el-input
          v-model="outContent"
          :placeholder="isThinking ? '正在翻译...' : '译文'"
          type="textarea"
          resize="none"
          class="h-full"
          readonly
        />
      </div>
    </el-main>
  </el-container>
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
