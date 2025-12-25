<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import PixelText from '@/components/PixelText.vue'

const props = defineProps({
    transparent: {
        type: Boolean,
        default: false
    }
})

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const showNotifications = ref(false)

const goHome = () => router.push('/')
const goToAuth = () => router.push('/login')
const goToProfile = () => router.push('/profile')

const handleLogout = async () => {
    await authStore.logout()
    router.push('/')
}

const toggleNotifications = () => {
    showNotifications.value = !showNotifications.value
    if (showNotifications.value) {
        notificationStore.fetchNotifications()
    }
}

const handleMarkRead = async (noti) => {
    if (!noti.isRead) {
        await notificationStore.markRead(noti.id)
    }
}

const handleDeleteNoti = async (id) => {
    await notificationStore.removeNotification(id)
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
    if (authStore.user) {
        notificationStore.connectSSE()
    }
})

onUnmounted(() => {
    notificationStore.disconnectSSE()
})
</script>

<template>
    <nav class="flex justify-between items-center p-6 z-50 transition-all duration-300" :class="[
        transparent ? 'absolute top-0 left-0 w-full bg-transparent' : 'relative border-b border-white/10 bg-[#0c0c0c]/95 backdrop-blur-sm shadow-md'
    ]">
        <!-- Left: Brand & Nav -->
        <div class="flex items-center gap-8">
            <div class="flex items-center gap-3 cursor-pointer group" @click="goHome">
                <PixelText as="div" variant="title"
                    class="text-white text-3xl tracking-wider group-hover:text-green-400 transition-colors">
                    Alkkagi
                </PixelText>
            </div>

            <!-- Navigation Links -->
            <div class="hidden md:flex items-center gap-6">
                <button @click="router.push('/campaigns')"
                    class="text-gray-400 hover:text-white transition-colors text-xs font-bold tracking-widest flex items-center gap-1 group">
                    <span
                        class="w-1.5 h-1.5 bg-gray-600 group-hover:bg-purple-500 rounded-full transition-colors"></span>
                    <PixelText>CAMPAIGN</PixelText>
                </button>
            </div>
        </div>

        <!-- Right: Auth Actions -->
        <div class="flex items-center gap-4">
            <button v-if="!authStore.user" @click="goToAuth"
                class="px-4 py-2 border-2 border-blue-500 text-blue-400 font-bold text-xs hover:bg-blue-500 hover:text-white transition-colors">
                <PixelText>[ LOGIN / SIGNUP ]</PixelText>
            </button>
            <div v-else class="flex items-center gap-4 relative">

                <!-- Welcome Msg -->
                <span class="text-gray-400 font-mono text-xs hidden md:inline">
                    WELCOME, <span class="text-green-400">{{ authStore.user?.nickname || 'FIGHTER' }}</span>
                </span>

                <!-- Notification Bell -->
                <div class="relative">
                    <button @click="toggleNotifications"
                        class="text-gray-400 hover:text-white transition-colors relative p-1 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>

                        <!-- Badge -->
                        <div v-if="notificationStore.unreadCount > 0"
                            class="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border border-black shadow-md animate-bounce">
                            {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
                        </div>
                    </button>

                    <!-- Dropdown Panel -->
                    <div v-if="showNotifications"
                        class="absolute right-0 top-12 w-80 bg-[#1e1e1e] border-2 border-gray-600 shadow-2xl z-50 rounded-lg overflow-hidden flex flex-col max-h-[400px]">
                        <div class="p-3 border-b border-gray-700 bg-black/40 flex justify-between items-center">
                            <span class="text-xs text-gray-400 font-bold tracking-widest">NOTIFICATIONS</span>
                            <button @click="showNotifications = false"
                                class="text-gray-500 hover:text-white text-xs">X</button>
                        </div>

                        <div class="flex-1 overflow-y-auto custom-scrollbar">
                            <div v-if="notificationStore.notifications.length === 0"
                                class="p-8 text-center text-gray-600 text-xs">
                                <span>NO SIGNALS DETECTED.</span>
                            </div>

                            <div v-else class="flex flex-col">
                                <div v-for="noti in notificationStore.notifications" :key="noti.id"
                                    class="p-3 border-b border-gray-800 hover:bg-white/5 transition-colors flex gap-3 relative group"
                                    :class="{ 'opacity-50': noti.isRead }" @click="handleMarkRead(noti)">

                                    <div class="mt-1.5 w-2 h-2 rounded-full shrink-0"
                                        :class="noti.isRead ? 'bg-gray-700' : 'bg-green-500 animate-pulse'"></div>

                                    <div class="flex-1 min-w-0">
                                        <p class="text-xs text-gray-300 font-bold mb-1 truncate">{{ noti.message }}</p>
                                        <div class="flex justify-between items-center">
                                            <span class="text-[10px] text-gray-500">{{ noti.type }}</span>
                                            <span class="text-[10px] text-gray-600">{{ formatDate(noti.createdAt)
                                                }}</span>
                                        </div>
                                    </div>

                                    <button @click.stop="handleDeleteNoti(noti.id)"
                                        class="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                            stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-px h-4 bg-gray-700 mx-2"></div>

                <button v-if="authStore.isAdmin" @click="router.push('/campaign/create')"
                    class="px-4 py-2 border-2 border-purple-500 text-purple-400 font-bold text-xs hover:bg-purple-500 hover:text-white transition-colors">
                    <PixelText>[ NEW MISSION ]</PixelText>
                </button>

                <button @click="goToProfile"
                    class="px-4 py-2 border-2 border-green-500 text-green-400 font-bold text-xs hover:bg-green-500 hover:text-white transition-colors">
                    <PixelText>[ MY_PAGE ]</PixelText>
                </button>
                <button @click="handleLogout"
                    class="px-4 py-2 border-2 border-red-500 text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-colors">
                    <PixelText>[ LOGOUT ]</PixelText>
                </button>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #111;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #666;
}
</style>
