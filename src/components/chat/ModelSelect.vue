<template>
  <el-select
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
import { onMounted } from 'vue'
import type { ModelGroup } from '@/types/provider'

defineProps<{
  modelValue?: number
  modelGroups?: ModelGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const onChange = (value: number | undefined) => {
  if (value) {
    emit('update:modelValue', value)
  }
}

onMounted(async () => {})
</script>
