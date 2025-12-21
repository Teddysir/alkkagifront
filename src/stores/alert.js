import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
    const isOpen = ref(false)
    const title = ref('')
    const message = ref('')
    const type = ref('alert') // 'alert' | 'confirm'

    const variant = ref('info') // 'info' | 'success' | 'error' | 'warning'

    let resolvePromise = null

    const reset = () => {
        isOpen.value = false
        title.value = ''
        message.value = ''
        type.value = 'alert'
        variant.value = 'info'
        resolvePromise = null
    }

    const inferVariant = (t) => {
        const text = (t || '').toUpperCase()
        if (text.includes('SUCCESS') || text.includes('WELCOME') || text.includes('COMPLETE')) return 'success'
        if (text.includes('ERROR') || text.includes('FAIL') || text.includes('DENIED') || text.includes('INVALID')) return 'error'
        if (text.includes('WARNING') || text.includes('DELETE') || text.includes('CAUTION')) return 'warning'
        return 'info'
    }

    const showAlert = (alertTitle, alertMessage) => {
        return new Promise((resolve) => {
            title.value = alertTitle || 'System'
            message.value = alertMessage
            type.value = 'alert'
            variant.value = inferVariant(title.value)
            isOpen.value = true
            resolvePromise = resolve
        })
    }

    const showConfirm = (confirmTitle, confirmMessage) => {
        return new Promise((resolve) => {
            title.value = confirmTitle || 'Confirm'
            message.value = confirmMessage
            type.value = 'confirm'
            variant.value = inferVariant(title.value)
            isOpen.value = true
            resolvePromise = resolve
        })
    }

    const handleAction = (result) => {
        if (resolvePromise) {
            resolvePromise(result)
        }
        reset()
    }

    return {
        isOpen,
        title,
        message,
        type,
        variant,
        showAlert,
        showConfirm,
        handleAction
    }
})
