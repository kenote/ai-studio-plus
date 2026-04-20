<template>
  <div
    v-if="type === 'assistant'"
    class="min-w-[200px] max-w-[85%] min-w-[280px] rounded-xl px-5 mx-4 py-4 max-w-full"
  >
    <el-progress
      v-if="isThinking"
      :percentage="30"
      :indeterminate="true"
      :show-text="false"
      color="#969696"
    />
    <div class="text-xs text-zinc-400 mb-4">{{ modelName }} · {{ formatDate(createdAt) }}</div>

    <div class="markdown-body" v-html="renderMarkdown(content)"></div>
  </div>
  <div v-else-if="type === 'user'" class="flex-row-reverse rounded-lg px-4 py-2 text-sm">
    <div
      class="min-w-[200px] max-w-[85%] min-w-[280px] rounded-xl px-5 py-4 max-w-full bg-coolgray-50 dark:bg-zinc-800"
    >
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
      <div class="markdown-body" v-html="renderMarkdown(contentText)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { ContentItem, ImageContent } from '@/types/chat'
import { formatDate } from '@/utils/message'
import { marked, type Tokens } from 'marked'
import hljs from 'highlight.js'
import { isString, isArray, isEqual } from 'lodash'

const props = withDefaults(
  defineProps<{
    type: 'user' | 'assistant' | 'system'
    content: string | ImageContent | ContentItem[]
    createdAt: number
    modelName?: string
    isThinking?: boolean
  }>(),
  {
    modelName: '',
    isThinking: false,
  },
)

const imageList = ref<string[]>([])
const contentText = ref<string>('')

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
    return marked(content)
  }
  return ''
}
</script>
