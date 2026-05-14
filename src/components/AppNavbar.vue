<template>
  <nav
    :class="[
      'flex items-center gap-1 text-sm',
      direction === 'horizontal' ? '!ml-0 mt-4 flex-col' : '',
    ]"
  >
    <template v-if="direction === 'vertical'">
      <router-link
        to="/chat"
        :class="{ 'router-link-active': $route.path.startsWith('/chat') }"
        class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm"
        >会话</router-link
      >
    </template>
    <template v-else-if="direction === 'horizontal'">
      <router-link
        to="/chat"
        title="会话"
        :class="{ 'router-link-active': $route.path.startsWith('/chat') }"
        class="nav-chat w-[36px] h-[32px] flex items-center justify-center text-size-base text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm ml-0 mt-1"
        ><el-icon><ChatSquare /></el-icon
      ></router-link>
      <router-link
        to="/translate"
        :class="{ 'router-link-active': $route.path.startsWith('/translate') }"
        class="nav-translate w-[36px] h-[32px] flex items-center justify-center text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm ml-0 mt-1"
      >
        <el-image
          class="dark:invert"
          style="width: 18px; height: 18px"
          src="/translate-duotone-svgrepo-com.svg"
          fit="cover"
        />
      </router-link>
    </template>
    <!-- <router-link
      to="/chat"
      :class="{ 'router-link-active': $route.path.startsWith('/chat') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm"
      >会</router-link
    > -->
    <!-- <router-link
      to="/draw"
      :class="{ 'router-link-active': $route.path.startsWith('/draw') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm m-1"
      >绘画</router-link
    > -->
    <!-- <router-link
      to="/video"
      :class="{ 'router-link-active': $route.path.startsWith('/video') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm m-1"
      >视频</router-link
    > -->
    <!-- <router-link
      to="/archive"
      :class="{ 'router-link-active': $route.path.startsWith('/archive') }"
      class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm m-1"
      >归档库</router-link
    > -->
  </nav>
</template>

<script setup lang="ts">
// import type { VNode } from 'vue'
import { ChatSquare } from '@element-plus/icons-vue'

// defineSlots<{
//   left?: () => VNode | null
//   center?: () => VNode | null
//   right?: () => VNode | null
// }>()

withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
  }>(),
  {
    direction: 'horizontal',
  },
)
</script>

<style scoped>
.router-link-active {
  background-color: #f4f4f5;
}
.dark .router-link-active {
  background-color: #27272a;
}
</style>
