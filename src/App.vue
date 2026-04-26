<script setup lang="ts">
import { computed, type Component, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const layout = computed<Component | null>(() => {
  return (route.meta.layout as Component) ?? null
})

const isSmallScreen = ref(false)
onMounted(() => {
  const checkScreen = () => {
    isSmallScreen.value = window.innerWidth < 964
  }
  checkScreen()
  window.addEventListener('resize', checkScreen)
})
</script>

<template>
  <div v-if="isSmallScreen" class="small-screen-tip">
    <div class="tip-content">
      <h2>屏幕尺寸不支持</h2>
      <p>请使用桌面设备访问本页面</p>
      <p>最小宽度要求：964px</p>
    </div>
  </div>
  <template v-else>
    <component :is="layout" v-if="layout">
      <RouterView />
    </component>
    <RouterView v-else />
  </template>
</template>

<style scoped>
.small-screen-tip {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  z-index: 9999;
}
.tip-content {
  text-align: center;
  padding: 2rem;
}
.tip-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}
.tip-content p {
  font-size: 1rem;
  color: #666;
  margin: 0.5rem 0;
}
</style>
