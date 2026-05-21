<script setup lang="ts">
import { onMounted } from 'vue'
// import { useRouter } from 'vue-router'

// const router = useRouter()

onMounted(() => {
  // router.push('/chat')
})
</script>

<template>
  <div class="chat-content h-full flex flex-col !overflow-x-auto min-w-3xl">
    <div
      class="border-t min-h-[160px] max-w-4xl w-stretch border-zinc-200 dark:border-zinc-800 p-3"
    ></div>
  </div>
</template>

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
