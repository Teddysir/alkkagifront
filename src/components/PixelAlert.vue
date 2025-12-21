<script setup>
import { useAlertStore } from '@/stores/alert'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

// Sub-components
import PixelSuccessAlert from '@/components/alerts/PixelSuccessAlert.vue'
import PixelErrorAlert from '@/components/alerts/PixelErrorAlert.vue'
import PixelDefaultAlert from '@/components/alerts/PixelDefaultAlert.vue'

const alertStore = useAlertStore()
const { isOpen, title, message, type, variant } = storeToRefs(alertStore)

const onConfirm = () => alertStore.handleAction(true)
const onCancel = () => alertStore.handleAction(false)

const currentComponent = computed(() => {
    switch (variant.value) {
        case 'success': return PixelSuccessAlert
        case 'error': return PixelErrorAlert
        default: return PixelDefaultAlert
    }
})
</script>

<template>
    <div v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm select-none">
        <component :is="currentComponent" :title="title" :message="message" :type="type" :variant="variant"
            :onConfirm="onConfirm" :onCancel="onCancel" />
    </div>
</template>
