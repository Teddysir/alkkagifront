<script setup>
import { RouterView } from 'vue-router'
import PixelAlert from '@/components/PixelAlert.vue'
import PixelChatBot from '@/components/chat/PixelChatBot.vue'
</script>

<template>
  <RouterView />
  <PixelChatBot />
  <PixelAlert />
</template>

<style scoped></style>
