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
      <el-table-column label="正则表达式" min-width="200">
        <template #default="{ row }">
          <el-input
            v-if="row.editing"
            v-model="row.regexp"
            placeholder="输入正则表达式"
            size="small"
          />
          <div v-else class="flex items-center gap-1">
            <span class="font-mono text-blue-600 dark:text-blue-400">{{ row.regexp }}</span>
            <el-button
              type="primary"
              link
              size="small"
              title="复制"
              @click.stop="copyRegexp(row.regexp!)"
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

type IFilterTable = FilterTable<string> & { editing?: boolean }

const filterTable = ref<IFilterTable[]>([])
const tableRef = ref()

const copyRegexp = async (regexp: string) => {
  await navigator.clipboard.writeText(regexp)
  ElMessage.success('已复制')
}

const loadData = async () => {
  const filters = await db.filters.toArray()
  filterTable.value = filters.map((f) => ({ ...f, editing: false, regexp: f.regexp?.source }))
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
    regexp: '',
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

const validateRegexp = (regexp: string): boolean => {
  try {
    new RegExp(regexp)
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
  if (!row.regexp?.trim()) {
    ElMessage.warning('请输入正则表达式')
    return
  }
  if (!validateRegexp(row.regexp)) {
    ElMessage.warning('正则表达式格式无效')
    return
  }

  const existing = filterTable.value.find((f) => f.name === row.name && f.id !== row.id)
  if (existing) {
    ElMessage.warning('名称已存在')
    return
  }

  if (row.id === undefined) {
    await db.filters.add({ name: row.name, regexp: new RegExp(row.regexp) })
  } else {
    await db.filters.update(row.id, { name: row.name, regexp: new RegExp(row.regexp) })
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
