<template>
  <div class="layout-default">
    <header class="layout-header">
      <slot name="header"></slot>
    </header>
    <main class="layout-main">
      <slot></slot>
    </main>
    <footer class="layout-footer">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { VNode } from 'vue'

defineSlots<{
  header?: () => VNode | null
  default?: () => VNode | null
  footer?: () => VNode | null
}>()
</script>

<style scoped>
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.layout-header {
  flex-shrink: 0;
}
.layout-main {
  flex: 1;
}
.layout-footer {
  flex-shrink: 0;
}
</style>
