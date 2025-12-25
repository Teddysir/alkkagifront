<script setup>
import { ref, onMounted } from 'vue'
import { getUserProfile } from '@/api/user'
import CommonHeader from '@/components/CommonHeader.vue'

// Import Sub-Components
import UserProfile from '@/components/mypage/UserProfile.vue'
import PendingReviews from '@/components/mypage/PendingReviews.vue'
import ReceivedReviews from '@/components/mypage/ReceivedReviews.vue'
import GivenReviews from '@/components/mypage/GivenReviews.vue'
import MySubmissions from '@/components/mypage/MySubmissions.vue'
import RecommendedProblems from '@/components/mypage/RecommendedProblems.vue'

const isLoading = ref(true)
const user = ref({})
const activeTab = ref('dashboard') // 'dashboard' or 'submissions'

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
            class="relative z-10 flex-1 max-w-[1400px] mx-auto w-full p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 h-full overflow-hidden">

            <!-- LEFT COLUMN: Profile (1) -->
            <div v-if="isLoading && !user.nickname" class="mt-4 text-center text-green-500 animate-pulse text-xs">
                SYNCING...
            </div>
            <aside class="flex flex-col gap-6 w-full h-full overflow-hidden">
                <!-- User Profile -->
                <div class="shrink-0">
                    <UserProfile :user="user || {}" @refresh="fetchProfile" />
                </div>

                <!-- Recommended Problems -->
                <div class="flex-1 min-h-0">
                    <RecommendedProblems />
                </div>
            </aside>

            <!-- RIGHT COLUMN: Grid Layout -->
            <main class="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-2">

                <!-- TAB NAVIGATION -->
                <div class="flex gap-4 border-b border-gray-800 shrink-0">
                    <button @click="activeTab = 'dashboard'"
                        class="pb-2 px-2 text-sm font-bold tracking-widest transition-all border-b-2"
                        :class="activeTab === 'dashboard' ? 'text-white border-green-500' : 'text-gray-600 border-transparent hover:text-gray-400'">
                        DASHBOARD
                    </button>
                    <button @click="activeTab = 'submissions'"
                        class="pb-2 px-2 text-sm font-bold tracking-widest transition-all border-b-2"
                        :class="activeTab === 'submissions' ? 'text-white border-green-500' : 'text-gray-600 border-transparent hover:text-gray-400'">
                        MY ARCHIVE
                    </button>
                </div>

                <!-- DASHBOARD TAB CONTENT -->
                <div v-if="activeTab === 'dashboard'" class="flex flex-col gap-6 flex-1 min-h-0">
                    <!-- TOP ROW: Todo Reviews (2) -->
                    <div class="shrink-0 min-h-[250px]">
                        <PendingReviews />
                    </div>

                    <!-- BOTTOM ROW: Received(3) & Given(4) -->
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
                        <!-- Received Reviews -->
                        <div class="h-full">
                            <ReceivedReviews />
                        </div>
                        <!-- Given Reviews -->
                        <div class="h-full">
                            <GivenReviews />
                        </div>
                    </div>
                </div>

                <!-- SUBMISSIONS TAB CONTENT -->
                <div v-else-if="activeTab === 'submissions'" class="flex-1 min-h-0 w-full">
                    <MySubmissions />
                </div>

            </main>
        </div>
    </div>
</template>
