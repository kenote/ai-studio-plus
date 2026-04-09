<template>
  <div class="space-y-6 pr-5 max-h-[525px]">
    <div
      class="flex items-center justify-between position-sticky top-0 bg-white dark:bg-zinc-900 z-10"
    >
      <h3 class="text-base font-medium">通用</h3>
    </div>

    <div class="space-y-4 bg-coolgray-50 p-4 rounded">
      <div class="flex items-center gap-2 justify-between">
        <span>主题</span>
        <el-form-item class="!mb-0 w-[120px]">
          <el-select
            v-model="configForm.theme"
            placeholder="请选择主题"
            @change="handleThemeChange"
            class="justify-end w-full"
          >
            <el-option label="浅色" value="light" />
            <el-option label="深色" value="dark" />
            <el-option label="跟随系统" value="auto" />
          </el-select>
        </el-form-item>
      </div>
    </div>

    <div class="text-sm font-medium pl-4">归档</div>
    <div class="space-y-4 bg-coolgray-50 p-4 rounded">
      <div class="flex items-center gap-2 justify-between">
        <span>开启</span>
        <el-form-item class="!mb-0 w-[40px]">
          <el-switch
            v-model="configForm.archive"
            @change="handleArchiveChange"
            class="justify-end w-full"
          />
        </el-form-item>
      </div>
      <el-divider />
      <div class="text-sm font-medium">Joplin Web Clipper</div>
      <el-form-item label="主机" label-width="150px">
        <el-input
          v-model="configForm.joplin.host"
          placeholder="默认 http://localhost:41184"
          @blur="handleJoplinChange"
          class="justify-end w-full"
        />
      </el-form-item>
      <el-form-item label="授权令牌" label-width="150px">
        <el-input
          v-model="configForm.joplin.token"
          placeholder="请输入 Joplin 授权令牌"
          show-password
          @blur="handleJoplinChange"
          class="justify-end w-full"
        />
      </el-form-item>
      <el-form-item label="归档目录" label-width="150px">
        <el-input
          v-model="configForm.joplin.folder"
          placeholder="AI Studio"
          @blur="handleJoplinChange"
          class="justify-end w-full"
        />
      </el-form-item>
    </div>

    <div class="text-sm font-medium">数据备份</div>
    <div class="space-y-4 bg-coolgray-50 p-4 rounded">
      <h3 class="text-sm font-medium">完整备份</h3>
      <div class="text-sm text-zinc-500">
        导入会清空现有数据并替换为文件中的数据。请谨慎操作，建议先导出数据进行备份。
      </div>
      <div class="flex gap-2">
        <el-button @click="exportData">
          <i class="i-lucide-download mr-1" />
          导出备份
        </el-button>
        <el-button @click="importData">
          <i class="i-lucide-upload mr-1" />
          导入备份
        </el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <el-divider />
      <h3 class="text-sm font-medium"><el-text type="danger">清除数据</el-text></h3>
      <div class="text-sm text-zinc-500">
        清除操作将删除所有数据，包括笔记、模型等。请谨慎操作。
      </div>
      <div class="flex gap-2">
        <el-button type="danger" plain @click="clearData">
          <i class="i-lucide-trash-2 mr-1" />
          清除数据
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { db } from '@/db'
import type { Config } from '@/types/config'
import { emitter, Events } from '@/utils/emitter'

const fileInputRef = ref<HTMLInputElement>()

const configForm = reactive<Config>({
  theme: 'light',
  archive: false,
  joplin: {
    host: '',
    token: '',
    folder: '',
  },
})

const initConfig = async () => {
  const config = await db.config.get(1)
  if (config) {
    configForm.theme = config.theme || 'light'
    configForm.archive = config.archive || false
    configForm.joplin = {
      host: config.joplin?.host || '',
      token: config.joplin?.token || '',
      folder: config.joplin?.folder || '',
    }
  } else {
    await db.config.put({
      id: 1,
      theme: 'light',
      archive: false,
      joplin: { host: '', token: '', folder: '' },
    })
  }
}

const saveConfig = async () => {
  const data = {
    id: 1,
    theme: configForm.theme,
    archive: configForm.archive,
    joplin: {
      host: configForm.joplin.host,
      token: configForm.joplin.token,
      folder: configForm.joplin.folder,
    },
  }
  await db.config.put(data)
}

const handleThemeChange = () => {
  const theme = configForm.theme
  if (theme === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
  saveConfig()
}

const handleArchiveChange = () => {
  saveConfig()
}

const handleJoplinChange = () => {
  saveConfig()
}

const resetConfig = () => {
  configForm.theme = 'light'
  configForm.archive = false
  configForm.joplin = { host: '', token: '', folder: '' }
  initConfig()
}

onMounted(() => {
  initConfig()
  emitter.on(Events.DATA_CHANGE, resetConfig)
})

onUnmounted(() => {
  emitter.off(Events.DATA_CHANGE, resetConfig)
})

const exportData = async () => {
  const data = {
    providers: await db.providers.toArray(),
    groups: await db.groups.toArray(),
    models: await db.models.toArray(),
    chats: await db.chats.toArray(),
    messages: await db.messages.toArray(),
    config: await db.config.toArray(),
    filters: await db.filters.toArray(),
    mappings: await db.mappings.toArray(),
  }
  const json = JSON.stringify(data, null, 2)
  const fileName = `ai-studio-plus-backup-${new Date().toISOString().slice(0, 10)}.json`

  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await (
        window as Window & {
          showDirectoryPicker: (options?: unknown) => Promise<FileSystemDirectoryHandle>
        }
      ).showDirectoryPicker()
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(json)
      await writable.close()
      ElMessage.success('导出成功')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Export error:', err)
        ElMessage.error('导出失败')
      }
    }
  } else {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }
}

const importData = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    await ElMessageBox.confirm(
      '导入数据将清空现有数据并替换为文件中的数据，是否继续？',
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    const text = await file.text()
    const data = JSON.parse(text)

    await db.transaction(
      'rw',
      [
        db.providers,
        db.groups,
        db.models,
        db.chats,
        db.messages,
        db.config,
        db.filters,
        db.mappings,
      ],
      async () => {
        await db.providers.clear()
        await db.groups.clear()
        await db.models.clear()
        await db.chats.clear()
        await db.messages.clear()
        await db.config.clear()
        await db.filters.clear()
        await db.mappings.clear()

        if (data.providers?.length) await db.providers.bulkAdd(data.providers)
        if (data.groups?.length) await db.groups.bulkAdd(data.groups)
        if (data.models?.length) await db.models.bulkAdd(data.models)
        if (data.chats?.length) await db.chats.bulkAdd(data.chats)
        if (data.messages?.length) await db.messages.bulkAdd(data.messages)
        if (data.config?.length) await db.config.bulkAdd(data.config)
        if (data.filters?.length) await db.filters.bulkAdd(data.filters)
        if (data.mappings?.length) await db.mappings.bulkAdd(data.mappings)
      },
    )

    ElMessage.success('导入成功，请刷新页面')
    emitter.emit(Events.DATA_CHANGE)
  } catch (error) {
    console.error('Import error:', error)
    ElMessage.error('导入失败，文件格式错误')
  }

  ;(event.target as HTMLInputElement).value = ''
}

const clearData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将删除所有数据，包括笔记、模型等，且无法恢复。是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await db.transaction(
      'rw',
      [
        db.providers,
        db.groups,
        db.models,
        db.chats,
        db.messages,
        db.config,
        db.filters,
        db.mappings,
      ],
      async () => {
        await db.providers.clear()
        await db.groups.clear()
        await db.models.clear()
        await db.chats.clear()
        await db.messages.clear()
        await db.config.clear()
        await db.filters.clear()
        await db.mappings.clear()
      },
    )
    ElMessage.success('数据已清除')
    emitter.emit(Events.DATA_CHANGE)
  } catch (err: unknown) {
    if (err !== 'cancel') {
      console.error('Clear data error:', err)
      ElMessage.error('清除失败')
    }
  }
}
</script>
