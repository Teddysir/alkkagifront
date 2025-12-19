<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    transparent: {
        type: Boolean,
        default: false
    }
})

const router = useRouter()
const authStore = useAuthStore()

const isLoggedIn = computed(() => !!authStore.token)

const goToAuth = () => router.push('/login')
const goToProfile = () => router.push('/profile')
const goHome = () => router.push('/')
</script>

<template>
    <nav class="flex justify-between items-center p-6 z-50 transition-all duration-300" :class="[
        transparent ? 'absolute top-0 left-0 w-full bg-transparent' : 'relative border-b border-gray-700 bg-[#1e1e1e]/95 backdrop-blur-sm shadow-md'
    ]">
        <!-- Left: Brand -->
        <div class="flex items-center gap-3 cursor-pointer group" @click="goHome">
            <div
                class="text-white text-3xl font-bold tracking-wider pixel-font group-hover:text-green-400 transition-colors">
                Alkkagi
            </div>
        </div>

        <!-- Right: Auth Actions -->
        <div class="flex items-center gap-4">
            <button v-if="!isLoggedIn" @click="goToAuth"
                class="px-4 py-2 border-2 border-blue-500 text-blue-400 font-bold text-xs hover:bg-blue-500 hover:text-white transition-colors pixel-font">
                [ LOGIN / SIGNUP ]
            </button>
            <div v-else class="flex items-center gap-4">
                <span class="text-gray-400 font-mono text-xs hidden md:inline ml-auto">
                    WELCOME, <span class="text-green-400">{{ authStore.user?.nickname || 'FIGHTER' }}</span>
                </span>
                <button @click="goToProfile"
                    class="px-4 py-2 border-2 border-green-500 text-green-400 font-bold text-xs hover:bg-green-500 hover:text-white transition-colors pixel-font">
                    [ MY_PAGE ]
                </button>
                <button @click="authStore.logout()"
                    class="px-4 py-2 border-2 border-red-500 text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors pixel-font">
                    [ LOGOUT ]
                </button>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.pixel-font {
    font-family: 'Press Start 2P', cursive;
    /* text-shadow removed for flat look */
}
</style>
