<template>
  <div
    class="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-500 dark:text-zinc-400"
  >
    <div class="text-6xl">⚙️</div>
    <h2 class="mb-0 text-xl font-semibold">请先添加{{ names[type] }}模型</h2>
    <p class="text-zinc-500 mt-0 mb-2">在设置页面添加供应商和模型</p>
    <el-button type="primary" @click="handleOpenSettings">去设置</el-button>
  </div>
</template>

<script setup lang="ts">
import { emitter, Events } from '@/utils/emitter'

const names = {
  chat: '聊天',
  draw: '绘画',
}

withDefaults(
  defineProps<{
    type?: 'chat' | 'draw'
  }>(),
  {
    type: 'chat',
  },
)

const handleOpenSettings = () => {
  emitter.emit(Events.OPEN_SETTINGS, { tag: 'provider' })
}
</script>
