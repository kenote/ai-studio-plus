<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-medium">供应商</h3>
      <el-button type="primary" @click="addProvider()">添加供应商</el-button>
    </div>

    <ModelDialog v-model:model-visible="modelDialogVisible" :group-id="currentGroupId" />

    <el-table
      :data="providers"
      stripe
      row-key="id"
      max-height="454"
      :expand-row-keys="expandedRows"
      :row-class-name="tableRowClassName"
      @expand-change="handleExpand"
    >
      <el-table-column prop="name" label="名称" width="120">
        <template #default="{ row }">
          <el-input v-if="row.editing" v-model="row.name" placeholder="输入名称" size="small" />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="apiBase" label="API 地址">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.apiBase"
            placeholder="输入API地址"
            size="small"
          />
          <div v-else class="flex items-center gap-2">
            <a
              :href="row.apiBase"
              target="_blank"
              class="text-sm text-teal-600 hover:text-teal-700 truncate block max-w-[150px]"
              >{{ row.apiBase }}</a
            >
            <el-button link size="small" @click="copyApiKey(row.apiBase)">
              <i class="i-lucide-copy" />
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <template v-if="row.editing">
            <el-button type="primary" link size="small" @click="saveProvider(row)">保存</el-button>
            <el-button link size="small" @click="cancelProvider(row)">取消</el-button>
          </template>
          <template v-else>
            <el-button type="primary" link size="small" @click="editProvider(row)">编辑</el-button>
            <el-button
              type="warning"
              link
              size="small"
              :disabled="!row.id"
              @click="toggleExpand(row)"
              >密钥</el-button
            >
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
      <el-table-column type="expand" width="0">
        <template #default="{ row }">
          <div class="p-4 bg-zinc-50 dark:bg-zinc-900" v-if="row.id > 0">
            <el-table :data="groups.filter((g) => g.providerId === row.id)" size="small">
              <el-table-column prop="name" label="名称" width="120">
                <template #default="{ row: groupRow }">
                  <el-input
                    v-if="groupRow.editing"
                    v-model="groupRow.name"
                    placeholder="输入名称"
                    size="small"
                  />
                  <span v-else>{{ groupRow.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="apiKey" label="密钥">
                <template #default="{ row: groupRow }">
                  <el-input
                    v-if="groupRow.editing"
                    v-model="groupRow.apiKey"
                    placeholder="输入密钥"
                    size="small"
                    show-password
                  />
                  <div v-else class="flex items-center gap-2 justify-between">
                    <span v-if="!groupRow.apiKey" class="text-sm text-zinc-400">未设置</span>
                    <template v-else>
                      <span class="text-sm text-zinc-500 truncate block max-w-[calc(100%-50px)]">{{
                        showApiKey[groupRow.id!]
                          ? groupRow.apiKey
                          : groupRow.apiKey.slice(0, 7) +
                            groupRow.apiKey
                              .slice(7, groupRow.apiKey.length - 11)
                              .replace(/./g, '*') +
                            groupRow.apiKey.slice(groupRow.apiKey.length - 4)
                      }}</span>
                      <span>
                        <el-button link size="small" @click="toggleShowApiKey(groupRow.id!)">
                          <i
                            :class="showApiKey[groupRow.id!] ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                          />
                        </el-button>
                        <el-button
                          link
                          size="small"
                          @click="copyApiKey(groupRow.apiKey)"
                          class="!ml-0"
                        >
                          <i class="i-lucide-copy" />
                        </el-button>
                      </span>
                    </template>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="{ row: groupRow }">
                  <template v-if="groupRow.editing">
                    <el-button type="primary" link size="small" @click="saveGroup(groupRow)"
                      >保存</el-button
                    >
                    <el-button link size="small" @click="cancelGroup(groupRow)">取消</el-button>
                  </template>
                  <template v-else>
                    <el-button type="primary" link size="small" @click="editGroup(groupRow)"
                      >编辑</el-button
                    >
                    <el-button type="info" link size="small" @click="openModel(groupRow)"
                      >模型</el-button
                    >
                    <el-button type="danger" link size="small" @click="deleteGroup(groupRow)"
                      >删除</el-button
                    >
                  </template>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" size="small" class="mt-2" @click="addGroup(row)"
              >添加密钥</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useClipboard } from '@vueuse/core'
import { db } from '@/db'
import type { Provider, Group } from '@/types/provider'
import ModelDialog from './ModelDialog.vue'
import { emitter, Events } from '@/utils/emitter'

type IProvider = Provider & { editing?: boolean }
type IGroup = Group & { editing?: boolean }

const providers = ref<IProvider[]>([])
const groups = ref<IGroup[]>([])
const currentId = ref(0)
const modelDialogVisible = ref(false)
const currentGroupId = ref<number | undefined>(undefined)
const expandedRows = ref<string[]>([])
const showApiKey = ref<Record<number, boolean>>({})
const { copy: copyText } = useClipboard()

const loadProviders = async () => {
  providers.value = await db.providers.toArray()
  groups.value = await db.groups.toArray()
  emitter.emit(Events.DATA_CHANGE)
}

const tableRowClassName = ({ row }: { row: IProvider }) => {
  return row.id === currentId.value ? 'bg-zinc-100 dark:bg-zinc-800' : ''
}

onMounted(loadProviders)

const handleExpand = (row: IProvider, expanded: boolean) => {
  if (!row.id) return
  if (expanded) {
    expandedRows.value = [String(row.id)]
  } else {
    expandedRows.value = []
  }
}

const addProvider = () => {
  if (providers.value.some((p) => p.id === 0)) {
    ElMessage.warning('请先保存当前新建行')
    return
  }
  const editingProvider = providers.value.find((p) => p.editing && p.id !== 0)
  if (editingProvider) {
    editingProvider.editing = false
  }
  const editingGroup = groups.value.find((g) => g.editing)
  if (editingGroup) {
    editingGroup.editing = false
  }
  expandedRows.value = []
  providers.value.push({
    id: 0,
    name: '',
    apiBase: '',
    editing: true,
  })
}

const editProvider = (row: IProvider) => {
  const editingProvider = providers.value.find((p) => p.editing && p.id !== 0)
  if (editingProvider && editingProvider.id !== row.id) {
    editingProvider.editing = false
  }
  const newProvider = providers.value.find((p) => p.id === 0)
  if (newProvider) {
    providers.value = providers.value.filter((p) => p.id !== 0)
  }
  const newGroup = groups.value.find((g) => g.id === 0)
  if (newGroup) {
    groups.value = groups.value.filter((g) => g.id !== 0)
  }
  row.editing = true
}

const saveProvider = async (row: IProvider) => {
  if (!row.name?.trim()) {
    ElMessage.warning('请输入供应商名称')
    return
  }
  if (!row.apiBase?.trim()) {
    ElMessage.warning('请输入API地址')
    return
  }
  const apiBase = row.apiBase.replace(/\/+$/, '')
  if (row.id) {
    await db.providers.update(row.id, { name: row.name, apiBase })
  } else {
    await db.providers.add({ name: row.name, apiBase })
  }
  row.editing = false
  loadProviders()
}

const cancelProvider = async (row: IProvider) => {
  if (row.id === 0) {
    providers.value = providers.value.filter((p) => p.id !== 0)
  } else {
    row.editing = false
    loadProviders()
  }
}

const toggleExpand = (row: IProvider) => {
  if (!row.id) return
  expandedRows.value = expandedRows.value.includes(String(row.id)) ? [] : [String(row.id)]
}

const addGroup = (row: IProvider) => {
  if (groups.value.some((g) => g.providerId === row.id && g.id === 0)) {
    ElMessage.warning('请先保存当前新建密钥')
    return
  }
  const editingProvider = providers.value.find((p) => p.editing && p.id !== 0)
  if (editingProvider) {
    editingProvider.editing = false
  }
  const editingGroup = groups.value.find((g) => g.editing && g.id !== 0)
  if (editingGroup) {
    editingGroup.editing = false
  }
  const newProvider = providers.value.find((p) => p.id === 0)
  if (newProvider) {
    providers.value = providers.value.filter((p) => p.id !== 0)
  }
  groups.value.push({
    id: 0,
    name: '',
    apiKey: '',
    providerId: row.id!,
    editing: true,
  })
}

const editGroup = (row: IGroup) => {
  const editingProvider = providers.value.find((p) => p.editing && p.id !== 0)
  if (editingProvider) {
    editingProvider.editing = false
  }
  const editingGroup = groups.value.find((g) => g.editing && g.id !== 0)
  if (editingGroup && editingGroup.id !== row.id) {
    editingGroup.editing = false
  }
  const newProvider = providers.value.find((p) => p.id === 0)
  if (newProvider) {
    providers.value = providers.value.filter((p) => p.id !== 0)
  }
  const newGroup = groups.value.find((g) => g.id === 0)
  if (newGroup) {
    groups.value = groups.value.filter((g) => g.id !== 0)
  }
  row.editing = true
}

const saveGroup = async (row: Group & { editing?: boolean }) => {
  if (!row.name?.trim()) {
    ElMessage.warning('请输入密钥名称')
    return
  }
  if (row.id) {
    await db.groups.update(row.id, { name: row.name, apiKey: row.apiKey })
  } else {
    await db.groups.add({ name: row.name, apiKey: row.apiKey, providerId: row.providerId })
  }
  row.editing = false
  loadProviders()
}

const cancelGroup = async (row: Group & { editing?: boolean }) => {
  if (row.id === 0) {
    groups.value = groups.value.filter((g) => !(g.id === 0 && g.providerId === row.providerId))
  } else {
    row.editing = false
    loadProviders()
  }
}

const deleteGroup = async (row: Group) => {
  try {
    await ElMessageBox.confirm(`确定要删除密钥 "${row.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await db.models.where('groupId').equals(row.id!).delete()
    await db.groups.delete(row.id)
    loadProviders()
  } catch {}
}

const handleDelete = async (row: IProvider) => {
  try {
    await ElMessageBox.confirm(`确定要删除供应商 "${row.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await db.groups.where('providerId').equals(row.id!).delete()
    await db.models.where('providerId').equals(row.id!).delete()
    await db.providers.delete(row.id!)
    loadProviders()
  } catch {}
}

const toggleShowApiKey = (id: number) => {
  showApiKey.value[id] = !showApiKey.value[id]
}

const copyApiKey = async (text: string) => {
  try {
    await copyText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const openModel = (row: IGroup) => {
  currentGroupId.value = row.id
  modelDialogVisible.value = true
}
</script>

<style lang="less">
/* 隐藏展开列的单元格 */
.el-table__expand-column {
  width: 0 !important;
  padding: 0 !important;
  border-right: none !important;
}

/* 隐藏展开图标 */
.el-table__expand-icon {
  display: none !important;
}
</style>
