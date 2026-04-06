<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-medium">模型</h3>
      <el-button type="primary" @click="addModel()">添加模型</el-button>
    </div>

    <el-table :data="models" stripe row-key="id">
      <el-table-column prop="name" label="模型" min-width="150">
        <template #default="{ row }">
          <el-input v-if="row.id === 0" v-model="row.name" placeholder="输入名称" size="small" />
          <div v-else class="flex items-center gap-1">
            <span>{{ row.name }}</span>
            <el-button link size="small" @click="copyName(row.name)">
              <i class="i-lucide-copy" />
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="供应商分组" width="180">
        <template #default="{ row }">
          <el-select
            v-if="row.id === 0"
            v-model="row.groupId"
            placeholder="选择密钥分组"
            size="small"
            @change="handleGroupChange(row)"
          >
            <el-option-group v-for="p in providers" :key="p.id" :label="p.name">
              <el-option
                v-for="g in groups.filter((g) => g.providerId === p.id)"
                :key="g.id"
                :label="`${p.name} - ${g.name}`"
                :value="g.id"
              />
            </el-option-group>
          </el-select>
          <span v-else>{{ getProviderAndGroup(row.providerId, row.groupId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="180">
        <template #default="{ row }">
          <el-select
            v-if="row.editing"
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
          <div v-else class="flex flex-wrap gap-1">
            <el-tag v-for="t in row.type" :key="t" size="small" :type="getTypeTag(t)">{{
              getTypeLabel([t])
            }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <template v-if="row.editing">
            <el-button type="primary" link size="small" @click="saveModel(row)">保存</el-button>
            <el-button link size="small" @click="cancelModel(row)">取消</el-button>
          </template>
          <template v-else>
            <el-button type="primary" link size="small" @click="editModel(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!models.length" description="暂无模型，请添加" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useClipboard } from '@vueuse/core'
import { db } from '@/db'
import type { Provider, Group, Model } from '@/types/provider'

type IModel = Model & { editing?: boolean }

const models = ref<IModel[]>([])
const providers = ref<Provider[]>([])
const groups = ref<Group[]>([])
const { copy: copyText } = useClipboard()

const loadData = async () => {
  models.value = await db.models.toArray()
  providers.value = await db.providers.toArray()
  groups.value = await db.groups.toArray()
}

const getProviderAndGroup = (providerId: number, groupId: number) => {
  const provider = providers.value.find((p) => p.id === providerId)
  const group = groups.value.find((g) => g.id === groupId)
  return group ? `${provider?.name || '-'} - ${group.name}` : '-'
}

const getTypeLabel = (type: string[]) => {
  const labels: Record<string, string> = {
    chat: '对话',
    image: '图像',
    ocr: 'OCR',
    video: '视频',
    audio: '音频',
  }
  return type.map((t) => labels[t] || t).join(', ')
}

const getTypeTag = (type: string) => {
  const tags: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    chat: 'primary',
    image: 'success',
    ocr: 'warning',
    video: 'danger',
    audio: 'info',
  }
  return tags[type] || 'info'
}

onMounted(loadData)

const addModel = () => {
  if (models.value.some((m) => m.id === 0)) {
    ElMessage.warning('请先保存当前新建行')
    return
  }
  const editingRow = models.value.find((m) => m.editing && m.id !== 0)
  if (editingRow) {
    editingRow.editing = false
  }
  const newModel: IModel = {
    id: 0,
    name: '',
    providerId: undefined,
    groupId: undefined,
    type: ['chat'],
    editing: true,
  }
  models.value.push(newModel)
}

const editModel = (row: IModel) => {
  const editingRow = models.value.find((m) => m.editing && m.id !== 0)
  if (editingRow && editingRow.id !== row.id) {
    editingRow.editing = false
  }
  const newRow = models.value.find((m) => m.id === 0)
  if (newRow) {
    models.value = models.value.filter((m) => m.id !== 0)
  }
  row.editing = true
}

const handleGroupChange = (row: IModel) => {
  const group = groups.value.find((g) => g.id === row.groupId)
  if (group) {
    row.providerId = group.providerId
  }
}

const saveModel = async (row: IModel) => {
  if (!row.name?.trim()) {
    ElMessage.warning('请输入模型名称')
    return
  }
  if (!row.providerId) {
    ElMessage.warning('请选择供应商')
    return
  }
  if (!row.groupId) {
    ElMessage.warning('请选择密钥分组')
    return
  }
  if (!row.type?.length) {
    ElMessage.warning('请选择模型类型')
    return
  }

  const modelData = {
    name: row.name,
    providerId: row.providerId,
    groupId: row.groupId,
    type: [...row.type],
  }

  if (row.id) {
    await db.models.update(row.id, modelData)
  } else {
    await db.models.add(modelData)
  }
  row.editing = false
  loadData()
}

const cancelModel = async (row: IModel) => {
  if (row.id === 0) {
    models.value = models.value.filter((m) => m.id !== 0)
  } else {
    row.editing = false
    loadData()
  }
}

const handleDelete = async (row: IModel) => {
  try {
    await ElMessageBox.confirm(`确定要删除模型 "${row.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await db.models.delete(row.id!)
    loadData()
  } catch {}
}

const copyName = async (name: string) => {
  try {
    await copyText(name)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>
