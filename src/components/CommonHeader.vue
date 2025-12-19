```vue
<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import PixelText from '@/components/PixelText.vue'

const props = defineProps({
    transparent: {
        type: Boolean,
        default: false
    }
})

const authStore = useAuthStore()
const router = useRouter()

const goHome = () => router.push('/')
const goToAuth = () => router.push('/login')
const goToProfile = () => router.push('/profile')
</script>

<template>
    <nav class="flex justify-between items-center p-6 z-50 transition-all duration-300" :class="[
        transparent ? 'absolute top-0 left-0 w-full bg-transparent' : 'relative border-b border-white/10 bg-[#0c0c0c]/95 backdrop-blur-sm shadow-md'
    ]">
        <!-- Left: Brand -->
        <div class="flex items-center gap-3 cursor-pointer group" @click="goHome">
            <PixelText as="div" variant="title"
                class="text-white text-3xl tracking-wider group-hover:text-green-400 transition-colors">
                Alkkagi
            </PixelText>
        </div>

        <!-- Right: Auth Actions -->
        <div class="flex items-center gap-4">
            <button v-if="!authStore.user" @click="goToAuth"
                class="px-4 py-2 border-2 border-blue-500 text-blue-400 font-bold text-xs hover:bg-blue-500 hover:text-white transition-colors">
                <PixelText>[ LOGIN / SIGNUP ]</PixelText>
            </button>
            <div v-else class="flex items-center gap-4">
                <span class="text-gray-400 font-mono text-xs hidden md:inline ml-auto">
                    WELCOME, <span class="text-green-400">{{ authStore.user?.nickname || 'FIGHTER' }}</span>
                </span>

                <button v-if="authStore.isAdmin" @click="router.push('/campaign/create')"
                    class="px-4 py-2 border-2 border-purple-500 text-purple-400 font-bold text-xs hover:bg-purple-500 hover:text-white transition-colors">
                    <PixelText>[ NEW MISSION ]</PixelText>
                </button>

                <button @click="goToProfile"
                    class="px-4 py-2 border-2 border-green-500 text-green-400 font-bold text-xs hover:bg-green-500 hover:text-white transition-colors">
                    <PixelText>[ MY_PAGE ]</PixelText>
                </button>
                <button @click="authStore.logout()"
                    class="px-4 py-2 border-2 border-red-500 text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors">
                    <PixelText>[ LOGOUT ]</PixelText>
                </button>
            </div>
        </div>
    </nav>
</template>

<style scoped>
/* Local pixel-font removed, using PixelText component instead */
</style>
```
