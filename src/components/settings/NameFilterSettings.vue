<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-medium">名称过滤</h3>
      <el-button type="primary" @click="addFilter">添加规则</el-button>
    </div>

    <el-table ref="tableRef" :data="filterTable" stripe row-key="id" max-height="400">
      <el-table-column label="名称" width="120">
        <template #default="{ row }">
          <el-input v-if="row.editing" v-model="row.name" placeholder="输入名称" size="small" />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="过滤格式（正则）" min-width="200">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.pattern"
            placeholder="输入正则表达式"
            size="small"
          />
          <div v-else class="flex items-center gap-1">
            <span class="font-mono text-blue-600 dark:text-blue-400">{{ row.pattern }}</span>
            <el-button
              type="primary"
              link
              size="small"
              title="复制"
              @click.stop="copyPattern(row.pattern!)"
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
            <el-button type="primary" link size="small" @click="saveFilter(row)">保存</el-button>
            <el-button link size="small" @click="cancelFilter(row)">取消</el-button>
          </template>
          <template v-else>
            <el-button type="primary" link size="small" @click="editFilter(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!filterTable.length" description="暂无过滤规则，请添加" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { db } from '@/db'
import type { FilterTable } from '@/types/config'

type IFilterTable = FilterTable<string>

const filterTable = ref<IFilterTable[]>([])
const tableRef = ref()

const copyPattern = async (pattern: string) => {
  await navigator.clipboard.writeText(pattern)
  ElMessage.success('已复制')
}

const loadData = async () => {
  filterTable.value = await db.filters.toArray()
}

const addFilter = () => {
  const editingRow = filterTable.value.find((f) => f.editing)
  if (editingRow) {
    ElMessage.warning('请先保存当前编辑行')
    return
  }
  const newFilter: IFilterTable = {
    id: undefined,
    name: '',
    pattern: '',
    editing: true,
  }
  filterTable.value.unshift(newFilter)
}

const editFilter = (row: IFilterTable) => {
  const editingRow = filterTable.value.find((f) => f.editing && row.id && f.id !== row.id)
  if (editingRow) {
    ElMessage.warning('请先保存当前编辑行')
    return
  }
  const newRow = filterTable.value.find((f) => f.id === undefined)
  if (newRow && row.id !== undefined) {
    filterTable.value = filterTable.value.filter((f) => f.id !== undefined)
  }
  row.editing = true
}

const validatePattern = (pattern: string): boolean => {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

const saveFilter = async (row: IFilterTable) => {
  if (!row.name?.trim()) {
    ElMessage.warning('请输入名称')
    return
  }
  if (!row.pattern?.trim()) {
    ElMessage.warning('请输入过滤格式（正则）')
    return
  }
  if (!validatePattern(row.pattern)) {
    ElMessage.warning('过滤格式（正则）格式无效')
    return
  }

  const existing = filterTable.value.find((f) => f.name === row.name && f.id !== row.id)
  if (existing) {
    ElMessage.warning('名称已存在')
    return
  }

  if (row.id === undefined) {
    await db.filters.add({ name: row.name, pattern: row.pattern })
  } else {
    await db.filters.update(row.id, { name: row.name, pattern: row.pattern })
  }
  loadData()
}

const cancelFilter = async (row: IFilterTable) => {
  if (row.id === undefined) {
    filterTable.value = filterTable.value.filter((f) => f.id !== undefined)
  } else {
    loadData()
  }
}

const handleDelete = async (row: IFilterTable) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则 "${row.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    if (row.id !== undefined) {
      await db.filters.delete(row.id)
    }
    loadData()
  } catch {}
}

onMounted(loadData)
</script>
