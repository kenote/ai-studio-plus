<template>
  <div
    v-if="type === 'assistant'"
    class="min-w-[200px] max-w-[85%] min-w-[280px] rounded-xl px-5 mx-4 py-4 w-full"
    :id="`msg-${msgId}`"
  >
    <el-progress
      v-if="isThinking"
      :percentage="30"
      :indeterminate="true"
      :show-text="false"
      color="#969696"
    />
    <div class="text-xs text-zinc-400 mb-4 flex justify-between">
      <span>{{ modelName }} · {{ formatDate(createdAt) }}</span>
      <div v-if="content" class="flex flex-row-reverse pr-2 text-sm">
        <el-tooltip v-if="archive && joplin?.token" content="归档到 Joplin" placement="top">
          <el-image
            class="m-1 h-[16px] w-[16px] text-zinc-400 hover:text-zinc-600"
            src="/250px-Joplin-icon.svg.png"
            @click="handleArchiveJoplin"
        /></el-tooltip>
        <el-tooltip content="复制" placement="top">
          <el-icon
            class="m-1 !text-coolgray hover:!text-dark hover:dark:!text-light cursor-pointer"
            @click="handleCopyContent"
            ><CopyDocument /></el-icon
        ></el-tooltip>
      </div>
    </div>
    <div v-if="isThinking && openSearch" class="mb-2 text-sm text-coolgray">正在联网搜索...</div>
    <el-alert v-if="error" :title="String(error)" type="error" show-icon :closable="false" />
    <div v-else class="markdown-body" v-html="renderMarkdown(content)"></div>
    <el-dialog
      v-model="archiveDialogVisible"
      title="归档到 Joplin"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form @submit.prevent="handleArchiveConfirm">
        <el-form-item>
          <el-input v-model="archiveTitle" placeholder="输入笔记标题" :disabled="archiveLoading" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="archiveDialogVisible = false" :disabled="archiveLoading">取消</el-button>
        <el-button type="primary" :loading="archiveLoading" @click="handleArchiveConfirm"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
  <div
    v-else-if="type === 'user'"
    class="flex flex-col items-end rounded-lg px-4 py-2 text-sm"
    :id="`msg-${msgId}`"
  >
    <div class="max-w-[85%] min-w-[280px] rounded-xl px-5 py-4 bg-coolgray-50 dark:bg-zinc-800">
      <div class="text-xs text-zinc-400 mb-1">
        {{ formatDate(createdAt) }}
      </div>
      <div class="flex flex-row flex-wrap gap-2 my-4" v-if="imageList.length > 0">
        <template v-for="(image, key) in imageList" :key="key">
          <el-image
            :src="image"
            fit="cover"
            :preview-src-list="imageList"
            show-progress
            class="w-[100px] h-[100px]"
          />
        </template>
      </div>
      <div class="line-clamp-3">{{ contentText }}</div>
    </div>
    <div class="flex flex-row-reverse pr-2">
      <el-tooltip content="复制" placement="top">
        <el-icon
          class="m-1 !text-coolgray hover:!text-dark hover:dark:!text-light cursor-pointer"
          @click="handleCopyContent"
          ><CopyDocument /></el-icon
      ></el-tooltip>
      <el-tooltip content="重新回答" placement="top">
        <el-icon
          class="m-1 !text-coolgray hover:!text-dark hover:dark:!text-light cursor-pointer"
          @click="handleResend"
          ><RefreshRight /></el-icon
      ></el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { ContentItem, ImageContent } from '@/types/chat'
import { formatDate } from '@/utils/message'
import { marked, type Tokens } from 'marked'
import hljs from 'highlight.js'
import { isString, isArray, isEqual } from 'lodash-es'
import { CopyDocument, RefreshRight } from '@element-plus/icons-vue'
import { saveJoplin } from '@/utils/joplin'

const props = withDefaults(
  defineProps<{
    type: 'user' | 'assistant' | 'system'
    content: string | ImageContent | ContentItem[]
    createdAt: number
    modelName?: string
    isThinking?: boolean
    openSearch?: boolean
    msgId?: number
    error?: Error
    joplin?: {
      host?: string
      token: string
      folder?: string
    }
    archive?: boolean
  }>(),
  {
    modelName: '',
    isThinking: false,
  },
)

const imageList = ref<string[]>([])
const contentText = ref<string>('')
const archiveDialogVisible = ref(false)
const archiveTitle = ref('')
const archiveLoading = ref(false)

const emit = defineEmits<{
  resend: [value: number]
}>()

watch(
  () => props.content,
  (
    value: string | ImageContent | ContentItem[],
    oldValue: string | ImageContent | ContentItem[],
  ) => {
    if (isEqual(value, oldValue)) return
    readContent(value)
  },
)

const readContent = (value: string | ImageContent | ContentItem[]) => {
  imageList.value = []
  if (isString(value)) {
    contentText.value = value
  } else if (isArray(value)) {
    contentText.value = ''
    for (const item of value) {
      if (item.type === 'image_url') {
        imageList.value.push(item.image_url.url)
      } else if (item.type === 'text') {
        contentText.value += item.text
        break
      }
    }
  } else if (value.type === 'image_url') {
    imageList.value.push(value.image_url.url)
  }
}

const handleCopy = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('copy-btn')) {
    const pre = target.parentElement
    if (pre) {
      const code = decodeURIComponent(pre.dataset.code || '')
      navigator.clipboard.writeText(code)
      target.textContent = '已复制'
      setTimeout(() => {
        target.textContent = '复制'
      }, 2000)
    }
  }
}

const handleCopyContent = () => {
  navigator.clipboard.writeText(contentText.value)
  ElMessage.success('已复制到剪贴板')
}

const handleResend = () => {
  if (!props.msgId) return
  emit('resend', props.msgId)
}

const handleArchiveJoplin = () => {
  // archiveTitle.value = contentText.value.slice(0, 30)
  archiveDialogVisible.value = true
}

const validateArchiveTitle = (value: string) => {
  if (!value || !value.trim()) {
    return '标题不能为空'
  }
  if (/[\\/:*?"<>|]/.test(value)) {
    return '标题不能包含特殊字符 \\ / : * ? " < > |'
  }
  return true
}

const handleArchiveConfirm = async () => {
  if (!archiveDialogVisible.value) return
  const errorMsg = validateArchiveTitle(archiveTitle.value)
  if (errorMsg !== true) {
    ElMessage.error(errorMsg)
    return
  }
  archiveLoading.value = true
  try {
    await saveJoplin(archiveTitle.value, contentText.value, props.joplin!)
    archiveDialogVisible.value = false
    archiveLoading.value = false
    ElMessage.success(`已归档到 Joplin 笔记中`)
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message ?? error.name)
    }
  } finally {
    if (archiveDialogVisible.value) {
      archiveLoading.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleCopy)
  readContent(props.content)
})

onUnmounted(() => {
  document.removeEventListener('click', handleCopy)
})

const renderer = new marked.Renderer()
renderer.link = ({ href, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : ''
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`
}
renderer.code = ({ text, lang }: Tokens.Code) => {
  const language = lang || ''
  let highlighted: string
  if (language && hljs.getLanguage(language)) {
    highlighted = hljs.highlight(text, { language }).value
  } else {
    highlighted = hljs.highlightAuto(text).value
  }
  const langLabel = language ? `<span class="code-lang">${language}</span>` : ''
  return `<pre class="hljs" data-code="${encodeURIComponent(text)}">${langLabel}<button class="copy-btn">复制</button><code class="${language}">${highlighted}</code></pre>`
}
marked.use({ renderer })

const renderMarkdown = (content: string | ImageContent | ContentItem[]) => {
  if (typeof content === 'string') {
    try {
      return marked(content) || ''
    } catch {
      return content
    }
  }
  return ''
}
</script>
