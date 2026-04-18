<template>
  <nav class="flex items-center gap-1 text-sm">
    <router-link
      to="/chat"
      :class="{ 'router-link-active': $route.path.startsWith('/chat') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm m-1"
      >会话</router-link
    >
    <router-link
      to="/draw"
      :class="{ 'router-link-active': $route.path.startsWith('/draw') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm m-1"
      >绘画</router-link
    >
    <router-link
      to="/video"
      :class="{ 'router-link-active': $route.path.startsWith('/video') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm m-1"
      >视频</router-link
    >
    <router-link
      to="/archive"
      :class="{ 'router-link-active': $route.path.startsWith('/archive') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm m-1"
      >归档库</router-link
    >
  </nav>
</template>

<script setup lang="ts">
// import type { VNode } from 'vue'

// defineSlots<{
//   left?: () => VNode | null
//   center?: () => VNode | null
//   right?: () => VNode | null
// }>()
</script>

<style scoped>
.router-link-active {
  background-color: #f4f4f5;
}
.dark .router-link-active {
  background-color: #27272a;
}
</style>
