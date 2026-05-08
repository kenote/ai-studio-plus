<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-medium">聊天助手</h3>
      <el-button type="primary" @click="openDialog()">添加助手</el-button>
    </div>

    <div v-if="assistantTable.length > 0" class="grid grid-cols-3 gap-4">
      <el-card
        v-for="row in assistantTable"
        :key="row.id"
        class="cursor-pointer hover:!border-zinc-300 dark:hover:!border-zinc-600"
        :body-style="{ padding: '12px' }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ row.name }}</span>
            <div>
              <el-button type="primary" link size="small" @click.stop="openDialog(row)"
                >编辑</el-button
              >
              <el-button type="danger" link size="small" @click.stop="handleDelete(row)"
                >删除</el-button
              >
            </div>
          </div>
        </template>
        <div class="bg-coolgray-100 dark:bg-coolgray-700 p-2 rounded">
          <div class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
            {{ row.content || '未设置' }}
          </div>
        </div>
      </el-card>
    </div>

    <el-empty v-if="!assistantTable.length" description="暂无聊天助手，请添加" />

    <el-dialog v-model="dialogVisible" title="聊天助手" width="500px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="输入名称" />
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input
            v-model="form.content"
            type="textarea"
            resize="none"
            :autosize="{ minRows: 6, maxRows: 6 }"
            placeholder="输入系统提示词"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAssistant">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/db'
import type { Assistant as AssistantItem } from '@/types/chat'

// interface AssistantItem extends Assistant {}

const assistantTable = ref<AssistantItem[]>([])
// const tableRef = ref()

const dialogVisible = ref(false)
const form = ref<AssistantItem>({
  name: '',
  content: '',
})

const loadData = async () => {
  assistantTable.value = await db.assistant.toArray()
}

const openDialog = (row?: AssistantItem) => {
  if (row) {
    form.value = { ...row }
  } else {
    form.value = {
      name: '',
      content: '',
    }
  }
  dialogVisible.value = true
}

const saveAssistant = async () => {
  if (!form.value.name?.trim()) {
    ElMessage.warning('请输入名称')
    return
  }

  if (form.value.id === undefined) {
    await db.assistant.add({ ...form.value })
  } else {
    await db.assistant.update(form.value.id, { ...form.value })
  }

  dialogVisible.value = false
  loadData()
  ElMessage.success('保存成功')
}

const handleDelete = async (row: AssistantItem) => {
  try {
    await ElMessageBox.confirm(`确定要删除助手 "${row.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      modalClass: '!z-3000',
    })
    if (row.id !== undefined) {
      await db.assistant.delete(row.id)
    }
    loadData()
  } catch {}
}

onMounted(loadData)
</script>

<style scoped>
:deep(.el-card__header) {
  border-bottom: none;
  padding: 12px 16px;
}
</style>
