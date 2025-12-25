<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getPendingReviews } from '@/api/review'
import PixelText from '@/components/PixelText.vue'

const router = useRouter()

const reviews = ref([])
const totalCount = ref(0)
const isLoading = ref(false)

// Sort: 'latest' (createdAt desc) | 'deadline' (endDate asc)
const sortOption = ref('deadline')

const fetchReviews = async () => {
    try {
        isLoading.value = true
        let sortBy = 'endDate'
        let sortDirection = 'asc'

        if (sortOption.value === 'latest') {
            sortBy = 'createdAt'
            sortDirection = 'desc'
        }

        const res = await getPendingReviews({
            sortBy,
            sortDirection,
            limit: 100 // Get enough so we scroll? Or just 6-9
        })

        // The API returns consistent structure?
        // User said: data: { content: [], ... }
        const data = res.data?.data || res.data || {}
        reviews.value = data.content || []
        totalCount.value = data.page?.totalElements || reviews.value.length

    } catch (e) {
        console.error("Failed to load pending reviews", e)
    } finally {
        isLoading.value = false
    }
}

watch(sortOption, () => {
    fetchReviews()
})

onMounted(() => {
    fetchReviews()
})

const goToSubmission = (id) => {
    router.push(`/submission/${id}`)
}

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return dateStr.split('T')[0]
}

const getDDay = (endDate) => {
    if (!endDate) return ''
    const end = new Date(endDate)
    const now = new Date()
    const diff = end - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return 'OVERDUE'
    if (days === 0) return 'D-DAY'
    return `D-${days}`
}
</script>

<template>
    <section
        class="h-full bg-[#1e1e1e] border-2 border-purple-500/50 p-0 flex flex-col relative overflow-hidden group/section pixel-window shadow-none">

        <!-- Header Bar -->
        <div
            class="h-8 bg-purple-500/10 border-b border-purple-500/30 flex items-center px-4 justify-between shrink-0 relative z-10">
            <h3 class="text-purple-400 font-bold flex items-center gap-2 text-xs">
                <PixelText>> PENDING_REVIEWS</PixelText>
                <span class="text-[10px] text-gray-500">({{ totalCount }})</span>
            </h3>

            <!-- Sort Select -->
            <select v-model="sortOption"
                class="bg-black text-[10px] text-purple-300 border border-purple-900 p-0.5 outline-none focus:border-purple-500 pixel-font rounded-none">
                <option value="deadline">DEADLINE</option>
                <option value="latest">LATEST</option>
            </select>
        </div>

        <!-- Glow Effect -->
        <div
            class="absolute inset-0 bg-purple-500/5 pointer-events-none group-hover/section:bg-purple-500/10 transition-colors z-0">
        </div>

        <div v-if="isLoading" class="flex-1 flex items-center justify-center text-purple-500/50 animate-pulse text-xs">
            > SCANNING_MISSIONS...
        </div>

        <div v-else-if="reviews.length === 0" class="flex-1 flex items-center justify-center text-gray-600 text-xs">
            NO PENDING REVIEWS. GOOD JOB!
        </div>

        <div v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 p-4 custom-scrollbar relative z-10">
            <div v-for="(item, index) in reviews" :key="item.submissionId"
                class="bg-black/40 border border-purple-900/50 p-4 hover:border-purple-500 hover:bg-purple-900/20 transition-all cursor-pointer group animate-slide-fade-in flex flex-col gap-2 rounded-xl"
                :style="{ animationDelay: `${index * 50}ms` }" @click="goToSubmission(item.submissionId)">

                <div class="flex justify-between items-start">
                    <span
                        class="text-[10px] text-purple-400 font-bold border border-purple-900/50 px-1 bg-purple-900/20 rounded-sm">{{
                            item.difficultyType }}</span>
                    <span class="text-[10px] text-red-400 animate-pulse font-bold">{{ getDDay(item.endDate) }}</span>
                </div>

                <div class="flex-1 min-w-0">
                    <h4 class="text-white text-sm font-bold truncate group-hover:text-purple-300">{{ item.problemTitle
                        }}</h4>
                    <p class="text-[10px] text-gray-500 truncate">{{ item.campaignTitle }}</p>
                </div>

                <div class="mt-2 flex justify-between items-end border-t border-purple-900/30 pt-2">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-gray-600">Until: {{ formatDate(item.endDate) }}</span>
                        <span class="text-[10px] text-gray-700">{{ item.platformType }}</span>
                    </div>
                    <button
                        class="text-[10px] bg-purple-600 text-white px-2 py-1 shadow-lg hover:bg-purple-500 transition-all rounded">START</button>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pixel-font {
    font-family: 'DungGeunMo', sans-serif;
}

.pixel-window {
    box-shadow: 4px 4px 0px #000000;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #581c87;
}

@keyframes slideFadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slide-fade-in {
    opacity: 0;
    animation: slideFadeIn 0.3s ease-out forwards;
}
</style>
