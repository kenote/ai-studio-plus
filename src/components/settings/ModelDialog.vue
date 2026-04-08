<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="800px" :close-on-click-modal="false">
    <div
      class="space-y-4 min-h-[460px]"
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-background="rgba(255, 255, 255, 0.6)"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 mr-2 w-full">
          <el-input v-model="searchText" placeholder="搜索模型名称" clearable />
        </div>
        <el-button :disabled="loading" @click="refresh">
          <i class="i-lucide-refresh-ccw mr-1" />
          刷新
        </el-button>
      </div>
      <div v-if="filteredModels.length > 0" class="space-y-2">
        <div class="text-sm text-zinc-500">共 {{ filteredModels.length }} 个模型</div>
        <el-table :data="filteredModels" stripe row-key="id" max-height="380">
          <el-table-column prop="name" label="名称" min-width="250" sortable>
            <template #default="{ row }">
              <div class="flex items-center gap-1">
                <span>{{ row.name }}</span>
                <el-button link size="small" @click="copyName(row.name)">
                  <i class="i-lucide-copy" />
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="150">
            <template #default="{ row }">
              <el-select
                v-model="row.type"
                placeholder="选择类型"
                size="small"
                multiple
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option label="对话" value="chat" />
                <el-option label="图像" value="image" />
                <el-option label="OCR" value="ocr" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column width="80">
            <template #default="{ row }">
              <el-switch :model-value="isImported(row.name)" @click="handleImportClick(row)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else-if="!loading && !searchText" description="暂无远程模型" />
      <el-empty v-else-if="!filteredModels.length && searchText" :description="emptyDescription" />
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useClipboard } from '@vueuse/core'
import { db } from '@/db'
import type { Model, Provider, Group } from '@/types/provider'
import { orderBy } from 'lodash'
import type { FilterTable } from '@/types/config'

type IModel = Model & { editing?: boolean }

type RemoteModel = {
  id: string
  object: string
  created: number
  owned_by: string
}

const props = defineProps<{
  modelVisible: boolean
  groupId?: number
}>()

const emit = defineEmits<{
  'update:modelVisible': [value: boolean]
}>()

const visible = ref(false)
const remoteModels = ref<IModel[]>([])
const importedNames = ref<string[]>([])
const loading = ref(false)
const searchText = ref('')
const filterTable = ref<FilterTable[]>([])

const filteredModels = computed(() => {
  if (!searchText.value) return remoteModels.value
  const keyword = searchText.value.toLowerCase()
  return remoteModels.value.filter((m) => m.name.toLowerCase().includes(keyword))
})

const emptyDescription = computed(() => {
  return `未找到 "${searchText.value}" 相关的模型`
})
const { copy: copyText } = useClipboard()

let currentProvider: Provider | undefined
let currentGroup: Group | undefined

const dialogTitle = computed(() => {
  const title = currentGroup ? `${currentProvider?.name || ''} - ${currentGroup.name}` : '模型'
  const count = remoteModels.value.length
  return count > 0 ? `${title} (${count})` : title
})

watch(
  () => props.modelVisible,
  async (val) => {
    visible.value = val
    if (val && props.groupId) {
      await loadData()
      await fetchRemoteModels()
    }
  },
)

watch(visible, (val) => {
  emit('update:modelVisible', val)
})

const loadData = async () => {
  if (!props.groupId) return
  const groups = await db.groups.toArray()
  currentGroup = groups.find((g) => g.id === props.groupId)
  if (currentGroup) {
    const providers = await db.providers.toArray()
    currentProvider = providers.find((p) => p.id === currentGroup?.providerId)
    const models = await db.models.where('groupId').equals(props.groupId).toArray()
    importedNames.value = models.map((m) => m.name)
  }
  filterTable.value = await db.filters.toArray()
}

const fetchRemoteModels = async () => {
  if (!currentProvider || !currentGroup?.apiKey) {
    ElMessage.warning('供应商或密钥信息缺失')
    return
  }
  loading.value = true
  try {
    const baseUrl = currentProvider.apiBase.replace(/\/+$/, '')
    const response = await axios.get(`${baseUrl}/v1/models`, {
      headers: {
        Authorization: `Bearer ${currentGroup.apiKey}`,
      },
    })
    let fillterName = currentGroup.name.toLowerCase()
    if (['官方', 'official'].includes(currentGroup.name.toLowerCase())) {
      fillterName = currentProvider.name.toLowerCase()
    }
    const regexp =
      filterTable.value.find((v) => v.name == currentGroup?.name.toLowerCase())?.regexp ??
      new RegExp(`^(${fillterName})`)
    const data =
      (<RemoteModel[]>response.data.data).filter(
        (v) => v.object === 'model' && regexp?.test(v.id),
      ) || []
    console.log('fetch models', response.data.data)
    console.log('fetch models', data)
    remoteModels.value = orderBy(
      data.map((m: { id: string }) => ({
        id: 0,
        name: m.id,
        providerId: currentProvider!.id!,
        groupId: currentGroup!.id!,
        type: [getModelType(m.id)],
        editing: false,
        remote: true,
      })),
      ['name'],
      ['asc'],
    )
    ElMessage.success(`获取到 ${data.length} 个模型`)
  } catch (error: unknown) {
    ElMessage.error('获取远程模型失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  searchText.value = ''
  await fetchRemoteModels()
}

const getModelType = (modelId: string): 'chat' | 'image' | 'ocr' | 'video' | 'audio' => {
  const id = modelId.toLowerCase()
  if (id.includes('vision') || id.includes('image') || id.includes('dall') || id.includes('draw')) {
    return 'image'
  }
  if (id.includes('ocr') || id.includes('text')) {
    return 'ocr'
  }
  if (id.includes('video') || id.includes('sora')) {
    return 'video'
  }
  if (
    id.includes('audio') ||
    id.includes('tts') ||
    id.includes('speech') ||
    id.includes('whisper')
  ) {
    return 'audio'
  }
  return 'chat'
}

const copyName = async (name: string) => {
  try {
    await copyText(name)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const isImported = (name: string) => {
  return importedNames.value.includes(name)
}

const handleImportClick = async (row: IModel) => {
  console.log(row)
  const a = await db.models.where('groupId').equals(row.groupId!).toArray()
  console.log(a.find((v) => v.name === row.name))
  if (isImported(row.name)) {
    const models = await db.models.where('groupId').equals(row.groupId!).toArray()
    const modelId = models.find((v) => v.name === row.name)?.id
    await db.models.delete(modelId!)
    // const index = importedNames.value.indexOf(row.name)
    // if (index > -1) {
    //   importedNames.value.splice(index, 1) // 从索引处开始删除 1 个元素
    //   ElMessage.success('移除模型 ' + row.name)
    // }
    importedNames.value = importedNames.value.filter((v) => v !== row.name)
    ElMessage.warning('移除模型 ' + row.name)
  } else {
    importRemoteModel(row)
  }
}

const importRemoteModel = async (row: IModel) => {
  await db.models.add({
    name: row.name,
    providerId: row.providerId,
    groupId: row.groupId,
    type: [...row.type],
  })
  importedNames.value.push(row.name)
  // remoteModels.value = remoteModels.value.filter((m) => m.name !== row.name)
  ElMessage.success('添加模型 ' + row.name)
}
</script>
