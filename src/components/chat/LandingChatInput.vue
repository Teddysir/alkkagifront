<script setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import PixelText from '@/components/PixelText.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

const inputPrompt = ref('')
const selectedType = ref('algorithm')

const types = [
    { label: '#ALGORITHM', value: 'algorithm' },
    { label: '#STRATEGY', value: 'strategy' },
    { label: '#FAQ', value: 'faq' },
    { label: '#HINT', value: 'hint' },
    { label: '#MOTIVATOR', value: 'motivator' },
]

const selectType = (val) => {
    selectedType.value = val
    chatStore.setRequestType(val)
}

const handleSubmit = () => {
    if (!inputPrompt.value.trim()) return

    // 1. Send Message via Store
    // Note: We might want to pass the type explicitly or let store handle logic
    // Store sendMessage uses currentRequestType if not passed
    chatStore.setRequestType(selectedType.value)
    chatStore.sendMessage(inputPrompt.value)

    // 2. Open Chat Window
    chatStore.openChat()

    // 3. Clear Input
    inputPrompt.value = ''
}
</script>

<template>
    <div v-if="authStore.isAuthenticated" class="w-full max-w-2xl mx-auto flex flex-col gap-4 animate-fade-in-up">

        <!-- Hashtag Selector -->
        <div class="flex flex-wrap justify-center gap-2">
            <button v-for="t in types" :key="t.value" @click="selectType(t.value)"
                class="px-3 py-1 text-[10px] md:text-xs font-bold border transition-all duration-300" :class="selectedType === t.value
                    ? 'bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
                    : 'bg-black/50 text-gray-500 border-gray-700 hover:text-green-400 hover:border-green-400'">
                {{ t.label }}
            </button>
        </div>

        <!-- Input Field -->
        <div class="relative group">
            <div
                class="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-purple-600 rounded opacity-50 blur group-hover:opacity-100 transition duration-500 group-hover:duration-200">
            </div>
            <div class="relative flex items-center bg-black rounded p-1">
                <input v-model="inputPrompt" @keyup.enter="handleSubmit" type="text" placeholder="Ask AI Commander..."
                    class="w-full bg-transparent text-white text-sm px-4 py-3 outline-none placeholder-gray-600 font-mono" />
                <button @click="handleSubmit"
                    class="bg-[#1a1a1a] hover:bg-green-900 border border-gray-700 hover:border-green-500 text-green-500 px-4 py-2 rounded text-xs font-bold transition-colors">
                    SEND
                </button>
            </div>
        </div>
    </div>

</template>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
