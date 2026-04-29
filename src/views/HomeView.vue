<script setup lang="ts">
import TheWelcome from '@/components/TheWelcome.vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.push('/chat')
})
</script>

<template>
  <TheWelcome />
</template>
