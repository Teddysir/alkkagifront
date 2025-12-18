<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative bg-zinc-900 h-14 flex items-center px-4 pixel-box transition-all duration-300 hover:bg-zinc-800">
    <input 
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      class="bg-transparent text-white placeholder-gray-500 flex-1 outline-none font-mono text-base tracking-widest w-full"
    />
  </div>
</template>

<style scoped>
/* Inherits .pixel-box from main.css */
</style>
