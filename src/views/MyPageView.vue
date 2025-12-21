<script setup>
import { ref, onMounted } from 'vue'
import { getUserProfile } from '@/api/user'
import CommonHeader from '@/components/CommonHeader.vue'

// Import Sub-Components
import UserProfile from '@/components/mypage/UserProfile.vue'
import PendingReviews from '@/components/mypage/PendingReviews.vue'
import ReceivedReviews from '@/components/mypage/ReceivedReviews.vue'
import GivenReviews from '@/components/mypage/GivenReviews.vue'

const isLoading = ref(true)
const user = ref({})

const fetchProfile = async () => {
    try {
        isLoading.value = true
        const res = await getUserProfile()
        user.value = res.data
    } catch (e) {
        console.error(e)
        // alert('Failed to load profile') // Suppress for initial load in case auth flow is tricky
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchProfile()
})
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative selection:bg-green-500/30">
        <!-- Background -->
        <div class="absolute inset-0 z-0">
            <img src="@/assets/pixel_city_bg.png" class="w-full h-full object-cover opacity-60 fixed"
                alt="Cyberpunk City" />
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm fixed"></div>
        </div>

        <CommonHeader />

        <div
            class="relative z-10 flex-1 max-w-[1600px] mx-auto w-full p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 h-full overflow-hidden">

            <!-- LEFT COLUMN: Profile (1) -->
            <aside class="w-full h-full overflow-y-auto custom-scrollbar">
                <UserProfile :user="user || {}" @refresh="fetchProfile" />
                <div v-if="isLoading && !user.nickname" class="mt-4 text-center text-green-500 animate-pulse text-xs">
                    SYNCING...
                </div>
            </aside>

            <!-- RIGHT COLUMN: Grid Layout -->
            <main class="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">

                <!-- TOP ROW: Todo Reviews (2) -->
                <div class="shrink-0 min-h-[250px]">
                    <PendingReviews />
                </div>

                <!-- BOTTOM ROW: Received(3) & Given(4) -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
                    <!-- Received Reviews -->
                    <div class="h-[300px]">
                        <ReceivedReviews />
                    </div>
                    <!-- Given Reviews -->
                    <div class="h-[300px]">
                        <GivenReviews />
                    </div>
                </div>

            </main>
        </div>
    </div>
</template>
