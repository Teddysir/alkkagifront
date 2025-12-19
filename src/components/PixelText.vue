<script setup>
defineProps({
    as: {
        type: String,
        default: 'span'
    },
    variant: {
        type: String,
        default: 'default' // default, title, small
    }
})
</script>

<template>
    <component :is="as" class="pixel-text" :class="variant">
        <slot></slot>
    </component>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap');

.pixel-text {
    font-family: 'Pixelify Sans', sans-serif;
    letter-spacing: 0.05em;
    text-shadow: none;
    /* Explicitly removing shadow as requested */
}

.pixel-text.title {
    font-weight: 700;
}

.pixel-text.small {
    font-size: 0.875rem;
}
</style>
