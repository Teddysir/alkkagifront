import { defineStore } from 'pinia'
import { ref } from 'vue'
import { streamChat } from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
    // State
    const isOpen = ref(false)
    const messages = ref([
        // Initial Greeting
        {
            type: 'ROBOT',
            content: 'HELLO. I AM YOUR AI ASSISTANT.\nSELECT A PROTOCOL OR ASK ME A QUESTION DIRECTLY.'
        }
    ])
    const isLoading = ref(false)
    const currentRequestType = ref('algorithm') // Default

    // Actions
    const toggleChat = () => {
        isOpen.value = !isOpen.value
    }

    const openChat = () => {
        isOpen.value = true
    }

    const setRequestType = (type) => {
        currentRequestType.value = type
    }

    const addMessage = (type, content) => {
        messages.value.push({ type, content })
    }

    const updateLastMessage = (chunk) => {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.type === 'ROBOT') {
            lastMsg.content += chunk
        } else {
            // Fallback if sync issue
            messages.value.push({ type: 'ROBOT', content: chunk })
        }
    }

    const sendMessage = async (text, type = null) => {
        if (!text.trim()) return

        // Use passed type or store default
        const reqType = type || currentRequestType.value

        // 1. Add User Message
        addMessage('USER', text)

        // 2. Prepare Robot Placeholder
        isLoading.value = true
        addMessage('ROBOT', '') // Empty start for streaming

        // 3. Call API
        await streamChat({
            userInput: text,
            requestType: reqType,
            onChunk: (chunk) => {
                updateLastMessage(chunk)
            },
            onError: (err) => {
                updateLastMessage('\n[ERROR: CONNECTION INTERRUPTED]')
                isLoading.value = false
            },
            onComplete: () => {
                isLoading.value = false
            }
        })
    }

    return {
        isOpen,
        messages,
        isLoading,
        currentRequestType,
        toggleChat,
        openChat,
        setRequestType,
        sendMessage
    }
})
