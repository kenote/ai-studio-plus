<template>
  <el-container class="h-full">
    <el-header
      class="flex items-center border-coolgray-300 border-b-solid border-b bg-white dark:bg-zinc-900 dark:border-zinc-800"
    >
      <nav class="flex items-center h-12 w-stretch">
        <div class="flex flex-1 items-center">
          <span
            @click="() => console.log('ok')"
            class="p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm mr-4"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </span>
          <router-link to="/" class="flex items-center mr-2">
            <img src="/logo.svg" class="h-10 w-10 dark:invert" alt="AI Studio" />
          </router-link>
          <!--  -->
          <app-navbar class="ml-2" />
        </div>

        <div class="flex flex-2 items-center justify-center">
          <slot name="top"></slot>
        </div>
        <div class="flex flex-1 items-center justify-end">
          <!-- <slot name="right"></slot> -->
          <span
            @click="openSettings"
            title="配置"
            class="font-900 p-[4px_8px] text-zinc-950 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="{2}"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="{2}"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </span>
        </div>
      </nav>
    </el-header>
    <el-main class="h-full !p-0 !overflow-y-auto !overflow-x-hidden">
      <slot></slot>
    </el-main>
  </el-container>

  <el-dialog
    v-model="showSettings"
    width="960px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    show-close
    destroy-on-close
    class="settings-dialog"
    :header="false"
  >
    <div class="flex flex-col h-full">
      <!-- <div
        class="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-700"
      >
        <span class="text-lg font-medium">配置</span>
      </div> -->
      <div class="flex flex-1 min-h-0 pt-4">
        <aside class="border-r border-zinc-200 dark:border-zinc-700 pr-4 w-[160px]">
          <ul class="list-none space-y-1 m-0 p-0">
            <li class="ml-0 px-1 py-2 text-sm font-900">桌面</li>
            <li
              class="ml-0 px-3 py-2 rounded cursor-pointer text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              :class="activeMenu === 'general' ? 'bg-zinc-100 dark:bg-zinc-800' : ''"
              @click="activeMenu = 'general'"
            >
              通用
            </li>
            <li
              class="ml-0 px-3 py-2 rounded cursor-pointer text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              :class="activeMenu === 'filter' ? 'bg-zinc-100 dark:bg-zinc-800' : ''"
              @click="activeMenu = 'filter'"
            >
              名称过滤
            </li>
            <li
              class="ml-0 px-3 py-2 rounded cursor-pointer text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              :class="activeMenu === 'mapping' ? 'bg-zinc-100 dark:bg-zinc-800' : ''"
              @click="activeMenu = 'mapping'"
            >
              系统映射
            </li>
            <li class="ml-0 px-1 py-2 text-sm font-900">服务器</li>
            <li
              class="ml-0 px-3 py-2 rounded cursor-pointer text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              :class="activeMenu === 'provider' ? 'bg-zinc-100 dark:bg-zinc-800' : ''"
              @click="activeMenu = 'provider'"
            >
              供应商
              <span class="text-xs text-zinc-400">({{ providerCount }})</span>
            </li>
            <li
              class="ml-0 px-3 py-2 rounded cursor-pointer text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              :class="activeMenu === 'model' ? 'bg-zinc-100 dark:bg-zinc-800' : ''"
              @click="activeMenu = 'model'"
            >
              模型
              <span class="text-xs text-zinc-400">({{ modelCount }})</span>
            </li>
          </ul>
        </aside>
        <main class="flex-1 pl-4 max-w-[750px] position-relative">
          <el-scrollbar>
            <GeneralSettings v-if="activeMenu === 'general'" />
            <NameFilterSettings v-else-if="activeMenu === 'filter'" />
            <MappingSettings v-else-if="activeMenu === 'mapping'" />
            <ProviderSettings v-else-if="activeMenu === 'provider'" />
            <ModelSettings v-else-if="activeMenu === 'model'" />
          </el-scrollbar>
        </main>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import NameFilterSettings from '@/components/settings/NameFilterSettings.vue'
import MappingSettings from '@/components/settings/MappingSettings.vue'
import ProviderSettings from '@/components/settings/ProviderSettings.vue'
import ModelSettings from '@/components/settings/ModelSettings.vue'
import { db } from '@/db'
import { emitter, Events } from '@/utils/emitter'
import { usePreferredDark } from '@vueuse/core'

const showSettings = ref(false)
const activeMenu = ref('general')
const providerCount = ref(0)
const modelCount = ref(0)
const isDark = usePreferredDark()

const loadCounts = async () => {
  providerCount.value = await db.providers.count()
  modelCount.value = await db.models.count()
}

const openSettings = async () => {
  activeMenu.value = 'general'
  showSettings.value = true
  await loadCounts()
}

const applyTheme = async () => {
  const { theme } = (await db.config.get(1)) ?? { theme: 'light' }
  if (theme === 'auto') {
    document.documentElement.classList.toggle('dark', isDark.value)
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

onMounted(() => {
  applyTheme()
  emitter.on(Events.DATA_CHANGE, loadCounts)
})

onUnmounted(() => {
  emitter.off(Events.DATA_CHANGE, loadCounts)
})

watch(isDark, async (newVal) => {
  const { theme } = (await db.config.get(1)) ?? { theme: 'light' }
  if (theme === 'auto') {
    document.documentElement.classList.toggle('dark', newVal)
  }
})
</script>

<style>
.settings-dialog {
  height: 600px;
}
.settings-dialog .el-dialog__body {
  padding: 0;
}
</style>
