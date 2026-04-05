<template>
  <div class="layout-blank">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import type { VNode } from 'vue'

defineSlots<{
  default?: () => VNode | null
}>()
</script>

<style scoped>
.layout-blank {
  min-height: 100vh;
}
</style>
