<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import PixelText from '@/components/PixelText.vue'
import PixelButton from '@/components/PixelButton.vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css' // VS Code Dark style

// Configure marked with highlight.js
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
})

const chatStore = useChatStore()
const authStore = useAuthStore()
const route = useRoute()

const isLandingPage = computed(() => route.path === '/')

const selectedType = ref('algorithm')
const types = [
    { label: '#ALGORITHM', value: 'algorithm' },
    { label: '#STRATEGY', value: 'strategy' },
    { label: '#FAQ', value: 'faq' },
    // { label: '#HINT', value: 'hint' },
    { label: '#MOTIVATOR', value: 'motivator' },
]

const selectType = (val) => {
    selectedType.value = val
    chatStore.setRequestType(val)
}

const inputMessage = ref('')
const msgContainer = ref(null)

// Auto-scroll to bottom
watch(() => chatStore.messages.length, async () => {
    await nextTick()
    scrollToBottom()
})

// Logout cleaner
watch(() => authStore.isAuthenticated, (newVal) => {
    if (!newVal && chatStore.isOpen) {
        chatStore.toggleChat() // Close it
    }
})

const loadingText = ref('생각중...')
const loadingMessages = [
    '딴짓중...',
    '오늘 저녁 메뉴 뭐먹을지 고민중...',
    '취업 걱정을 하는중...',
    '오랜 고민을 하는중...',
    '끝나고 뭐할지 고민중...',
    '개발자가 이걸 어떻게 만들었을지 고민중...',
    '백엔드 vs 프론트엔드 고민중...',
]

let loadingInterval = null

watch(() => chatStore.isLoading, (newVal) => {
    if (newVal) {
        clearInterval(loadingInterval)
        loadingInterval = setInterval(() => {
            const idx = Math.floor(Math.random() * loadingMessages.length)
            loadingText.value = loadingMessages[idx]
        }, 2000)
    } else {
        clearInterval(loadingInterval)
        loadingText.value = '질문 분석중...'
    }
})

const scrollToBottom = () => {
    if (msgContainer.value) {
        msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
}

const handleSend = () => {
    if (!inputMessage.value.trim() || chatStore.isLoading) return
    chatStore.sendMessage(inputMessage.value)
    inputMessage.value = ''
    // Ensure we scroll after user sends
    nextTick(scrollToBottom)
}

const toggleChat = () => {
    chatStore.toggleChat()
    if (chatStore.isOpen) {
        nextTick(scrollToBottom)
    }
}

const renderMarkdown = (text) => {
    return marked.parse(text)
}
</script>

<template>
    <div class="z-[9999]" v-if="authStore.isAuthenticated">
        <!-- FLOATING ROBOT BUTTON (FAB) - Standard (Not on Landing) -->
        <button v-if="!chatStore.isOpen && !isLandingPage && !['/login'].includes(route.path)" @click="toggleChat"
            class="fixed bottom-8 right-8 w-14 h-14 bg-black/80 border-2 border-green-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_15px_rgba(74,222,128,0.5)] z-50 group">
            <!-- Robot Icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                class="w-8 h-8 text-green-500 group-hover:animate-bounce">
                <path
                    d="M12 2C13.1 2 14 2.9 14 4V5H16V7H17V9H18V14H17V17H21V19H17V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V19H3V17H7V14H6V9H7V7H8V5C8 3.9 8.9 2 10 2H12M10 4H12V5H10V4M9 7V9H15V7H9M9 10V14H15V10H9M11 11H13V13H11V11Z" />
            </svg>
        </button>

        <!-- LANDING PAGE HOVER TRIGGER ZONE -->
        <div v-if="isLandingPage && !chatStore.isOpen" @mouseenter="chatStore.openChat()"
            class="fixed bottom-0 left-0 w-full h-8 z-[60] flex items-end justify-center group cursor-pointer">
            <!-- Hint Line -->
            <div class="w-1/3 h-1 bg-green-500/30 group-hover:bg-green-500/80 rounded-t-full transition-colors mb-1">
            </div>
        </div>

        <!-- CHAT WINDOW -->
        <transition name="slide-up">
            <div v-if="chatStore.isOpen" @mouseleave="isLandingPage ? chatStore.closeChat() : null"
                class="fixed bg-black/90 backdrop-blur-md border border-green-500/50 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 overflow-hidden font-mono"
                :class="isLandingPage
                    ? 'bottom-0 left-1/2 -translate-x-1/2 w-[95%] md:w-[800px] h-[85vh] max-w-5xl rounded-t-lg border-b-0'
                    : 'bottom-8 right-8 w-[400px] md:w-[450px] h-[600px] rounded-lg'">

                <!-- Header -->
                <div
                    class="h-12 border-b border-green-500/30 flex justify-between items-center px-4 bg-green-500/10 shrink-0">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 animate-pulse rounded-full"></div>
                        <PixelText class="text-green-500 text-sm font-bold">AI_COMMANDER_V1</PixelText>
                    </div>
                    <button @click="toggleChat"
                        class="text-green-500 hover:text-white hover:rotate-90 transition-transform">
                        ✕
                    </button>
                </div>

                <!-- Messages Area -->
                <div ref="msgContainer" class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <div v-for="(msg, idx) in chatStore.messages" :key="idx" class="flex w-full"
                        :class="msg.type === 'USER' ? 'justify-end' : 'justify-start'">

                        <!-- ROBOT AVATAR -->
                        <div v-if="msg.type === 'ROBOT'"
                            class="w-6 h-6 mr-2 shrink-0 bg-green-900/50 rounded flex items-center justify-center border border-green-500/30 self-start mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                class="w-4 h-4 text-green-500">
                                <path
                                    d="M12 2C13.1 2 14 2.9 14 4V5H16V7H17V9H18V14H17V17H21V19H17V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V19H3V17H7V14H6V9H7V7H8V5C8 3.9 8.9 2 10 2H12Z" />
                            </svg>
                        </div>

                        <!-- BUBBLE -->
                        <div class="max-w-[80%] p-4 text-xs leading-relaxed break-words rounded relative" :class="msg.type === 'USER'
                            ? 'bg-green-600 text-black border border-green-400 font-bold'
                            : 'bg-[#1a1a1a] text-gray-300 border border-gray-700'">
                            <span v-if="msg.type === 'USER'">{{ msg.content }}</span>
                            <div v-else v-html="renderMarkdown(msg.content)" class="markdown-body"></div>

                            <!-- Loading Text -->
                            <span
                                v-if="msg.type === 'ROBOT' && idx === chatStore.messages.length - 1 && chatStore.isLoading"
                                class="block mt-2 text-[10px] text-green-500/80 animate-pulse font-mono">
                                > {{ loadingText }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Footer / Input -->
                <div class="p-3 border-t border-gray-700 bg-black/50 flex flex-col gap-2 shrink-0">

                    <!-- Hashtag Selector -->
                    <div class="flex flex-wrap gap-2 px-1">
                        <button v-for="t in types" :key="t.value" @click="selectType(t.value)"
                            class="px-2 py-0.5 text-[10px] font-bold border transition-all duration-300 rounded"
                            :class="selectedType === t.value
                                ? 'bg-green-500 text-black border-green-500'
                                : 'bg-black/50 text-gray-500 border-gray-700 hover:text-green-400 hover:border-green-400'">
                            {{ t.label }}
                        </button>
                    </div>

                    <form @submit.prevent="handleSend" class="relative">
                        <input v-model="inputMessage" type="text" placeholder="Type command..."
                            class="w-full bg-[#111] border border-gray-600 text-white text-xs p-3 pr-10 outline-none focus:border-green-500 transition-colors rounded" />
                        <button type="submit" :disabled="chatStore.isLoading || !inputMessage.trim()"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                class="w-4 h-4">
                                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(20px);
    opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Markdown Styles explicitly for the chat window */
:deep(.markdown-body) {
    font-family: inherit;
    font-size: 0.8rem;
    /* tiny bit larger than xs if needed, or stick to xs */
    line-height: 1.5;
}

:deep(.markdown-body p) {
    margin-bottom: 0.5rem;
}

:deep(.markdown-body p:last-child) {
    margin-bottom: 0;
}

:deep(.markdown-body code) {
    background-color: #333;
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    font-family: monospace;
    color: #4ade80;
    /* bright green for inline code */
}

:deep(.markdown-body pre) {
    background-color: #111;
    padding: 0.5rem;
    margin: 0.5rem 0;
    border-radius: 0.3rem;
    overflow-x: auto;
    border: 1px solid #333;
}

:deep(.markdown-body pre code) {
    background-color: transparent;
    padding: 0;
    color: #e5e5e5;
    display: block;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
    padding-left: 1.2rem;
    margin-bottom: 0.5rem;
}

:deep(.markdown-body ul) {
    list-style-type: disc;
}

:deep(.markdown-body ol) {
    list-style-type: decimal;
}

:deep(.markdown-body strong) {
    color: #fff;
    font-weight: bold;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3) {
    font-weight: bold;
    color: #fff;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}

:deep(.markdown-body h1) {
    font-size: 1.1em;
    border-bottom: 1px solid #333;
    padding-bottom: 0.2rem;
}

:deep(.markdown-body h2) {
    font-size: 1.0em;
}

:deep(.markdown-body blockquote) {
    border-left: 3px solid #4ade80;
    padding-left: 0.5rem;
    color: #999;
    margin: 0.5rem 0;
}
</style>
