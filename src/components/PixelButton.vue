<script setup>
defineProps({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'button' // button, submit, reset
  },
  variant: {
    type: String,
    default: 'primary' // primary, secondary, danger
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const getVariantClasses = (variant) => {
  switch (variant) {
    case 'primary': return 'bg-zinc-200 hover:bg-white text-black'
    case 'secondary': return 'bg-gray-700 hover:bg-gray-600 text-white'
    case 'danger': return 'bg-red-500 hover:bg-red-400 text-white'
    default: return 'bg-zinc-200 hover:bg-white text-black'
  }
}
</script>

<template>
  <button 
    :type="type"
    :disabled="disabled"
    class="h-14 px-6 flex items-center justify-center transition-colors pixel-btn disabled:opacity-50 font-mono font-bold tracking-widest text-lg"
    :class="getVariantClasses(variant)"
  >
    {{ text }}
  </button>
</template>

<style scoped>
/* Inherits .pixel-btn from main.css */
</style>
