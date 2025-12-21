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
        case 'primary': return 'bg-[#c0c0c0] text-black shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px]'
        case 'secondary': return 'bg-[#708090] text-white shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#a0a0a0] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px]'
        case 'danger': return 'bg-[#800000] text-white shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ff8080] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px]'
        default: return 'bg-[#c0c0c0] text-black shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px]'
    }
}
</script>

<template>
    <button :type="type" :disabled="disabled"
        class="h-14 px-6 flex items-center justify-center transition-none pixel-font disabled:opacity-50 disabled:cursor-not-allowed"
        :class="getVariantClasses(variant)">
        {{ text }}
    </button>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap');

.pixel-font {
    font-family: 'Pixelify Sans', sans-serif;
    letter-spacing: 0.1em;
    font-weight: 700;
    font-size: 1.125rem;
    /* 18px */
}
</style>
