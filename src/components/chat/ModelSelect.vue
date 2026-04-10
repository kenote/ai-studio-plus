<template>
  <el-select
    v-if="models.length > 0"
    :model-value="modelValue"
    placeholder="选择模型"
    class="w-64"
    @update:model-value="onChange"
  >
    <el-option-group v-for="group in modelGroups" :key="group.groupName" :label="group.groupName">
      <el-option
        v-for="model in group.models"
        :key="String(model.id)"
        :label="model.name"
        :value="model.id"
      />
    </el-option-group>
  </el-select>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Model, Provider, Group } from '@/types/provider'
import { db } from '@/db'

const props = defineProps<{
  modelValue?: number
  modelType?: 'chat' | 'image' | 'ocr' | 'video' | 'audio'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const models = ref<Model[]>([])
const providers = ref<Provider[]>([])
const groups = ref<Group[]>([])

interface ModelGroup {
  groupName: string
  models: Model[]
}

const modelGroups = computed((): ModelGroup[] => {
  const groupMap = new Map<number, ModelGroup>()
  for (const model of models.value) {
    if (!model.groupId) continue
    const groupInfo = groups.value.find((g) => g.id === model.groupId)
    if (!groupInfo) continue
    const provider = providers.value.find((p) => p.id === groupInfo.providerId)
    const providerName = provider?.name || '未知'
    const groupName = `${providerName} - ${groupInfo.name}`
    let group = groupMap.get(model.groupId)
    if (!group) {
      group = { groupName, models: [] }
      groupMap.set(model.groupId, group)
    }
    group.models.push(model)
  }
  return Array.from(groupMap.values())
})

const onChange = (value: number | undefined) => {
  if (value) {
    emit('update:modelValue', value)
  }
}

onMounted(async () => {
  const typeFilter = props.modelType || 'chat'
  models.value = (await db.models.toArray()).filter((m) => m.type?.includes(typeFilter))
  providers.value = await db.providers.toArray()
  groups.value = await db.groups.toArray()
})
</script>
