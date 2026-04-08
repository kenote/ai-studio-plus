<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-medium">系统映射</h3>
      <el-button type="primary" @click="addMapping">添加规则</el-button>
    </div>

    <el-table ref="tableRef" :data="mappingTable" stripe row-key="id" max-height="454">
      <el-table-column label="源名称" width="200">
        <template #default="{ row }">
          <div v-if="row.editing" class="flex items-center gap-1">
            <el-input v-model="row.source" placeholder="输入源名称" size="small" />
          </div>
          <div v-else class="flex items-center gap-1">
            <el-tooltip :content="row.source" placement="top" :show-after="500">
              <span class="truncate flex-1">{{ row.source }}</span>
            </el-tooltip>
            <el-button
              type="primary"
              link
              size="small"
              title="复制"
              @click.stop="copyText(row.source!)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="目标名称" min-width="180">
        <template #default="{ row }">
          <div v-if="row.editing" class="flex items-center gap-1">
            <el-input v-model="row.destination" placeholder="输入目标名称" size="small" />
          </div>
          <div v-else class="flex items-center gap-1">
            <el-tooltip :content="row.destination" placement="top" :show-after="500">
              <span class="truncate flex-1">{{ row.destination }}</span>
            </el-tooltip>
            <el-button
              type="primary"
              link
              size="small"
              title="复制"
              @click.stop="copyText(row.destination!)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <template v-if="row.editing">
            <el-button type="primary" link size="small" @click="saveMapping(row)">保存</el-button>
            <el-button link size="small" @click="cancelMapping(row)">取消</el-button>
          </template>
          <template v-else>
            <el-button type="primary" link size="small" @click="editMapping(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!mappingTable.length" description="暂无映射规则，请添加" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { db } from '@/db'
import type { Mapping } from '@/types/config'

type IMapping = Mapping & { editing?: boolean }

const mappingTable = ref<IMapping[]>([])
const tableRef = ref()

const copyText = async (text: string) => {
  await navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

const loadData = async () => {
  mappingTable.value = await db.mappings.toArray()
}

const addMapping = () => {
  const editingRow = mappingTable.value.find((m) => m.editing)
  if (editingRow) {
    ElMessage.warning('请先保存当前编辑行')
    return
  }
  const newMapping: IMapping = {
    id: undefined,
    source: '',
    destination: '',
    editing: true,
  }
  mappingTable.value.unshift(newMapping)
}

const editMapping = (row: IMapping) => {
  const editingRow = mappingTable.value.find((m) => m.editing && row.id && m.id !== row.id)
  if (editingRow) {
    ElMessage.warning('请先保存当前编辑行')
    return
  }
  const newRow = mappingTable.value.find((m) => m.id === undefined)
  if (newRow && row.id !== undefined) {
    mappingTable.value = mappingTable.value.filter((m) => m.id !== undefined)
  }
  row.editing = true
}

const saveMapping = async (row: IMapping) => {
  if (!row.source?.trim()) {
    ElMessage.warning('请输入源名称')
    return
  }
  if (!row.destination?.trim()) {
    ElMessage.warning('请输入目标名称')
    return
  }

  const existing = mappingTable.value.find((m) => m.source === row.source && m.id !== row.id)
  if (existing) {
    ElMessage.warning('源名称已存在')
    return
  }

  if (row.id === undefined) {
    await db.mappings.add({ source: row.source, destination: row.destination })
  } else {
    await db.mappings.update(row.id, { source: row.source, destination: row.destination })
  }
  loadData()
}

const cancelMapping = async (row: IMapping) => {
  if (row.id === undefined) {
    mappingTable.value = mappingTable.value.filter((m) => m.id !== undefined)
  } else {
    loadData()
  }
}

const handleDelete = async (row: IMapping) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则 "${row.source}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    if (row.id !== undefined) {
      await db.mappings.delete(row.id)
    }
    loadData()
  } catch {}
}

onMounted(loadData)
</script>
