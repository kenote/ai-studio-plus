<script setup lang="ts">
import { useLiveQuery } from '@/composables/useLiveQuery'
import { db } from '@/db'

const chats = useLiveQuery(() => db.chats.orderBy('updatedAt').reverse().toArray())

async function addChat() {
  await db.chats.add({
    title: 'New Chat',
    modelId: 1,
    providerId: 1,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    activeAt: new Date(),
  })
}
</script>

<template>
  <div>
    <button @click="addChat">Add Chat</button>
    <ul>
      <li v-for="chat in chats" :key="chat.id">{{ chat.title }}</li>
    </ul>
  </div>
</template>
