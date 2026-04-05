<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const layout = computed<Component | null>(() => {
  return (route.meta.layout as Component) ?? null
})
</script>

<template>
  <component :is="layout" v-if="layout">
    <RouterView />
  </component>
  <RouterView v-else />
</template>
