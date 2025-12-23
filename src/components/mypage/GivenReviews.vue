<script setup>
import { ref, onMounted } from 'vue'
import { getGivenReviews } from '@/api/review'
import PixelText from '@/components/PixelText.vue'

const reviews = ref([])
const page = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)
const LIMIT = 5

const fetchReviews = async () => {
    try {
        isLoading.value = true
        const res = await getGivenReviews({
            page: page.value,
            size: LIMIT,
            limit: LIMIT,
            offset: page.value * LIMIT,
            sortBy: 'createdAt',
            sortDirection: 'desc'
        })

        const data = res.data?.data || res.data || {}
        reviews.value = data.content || []

        const totalElements = data.page?.totalElements || 0
        totalPages.value = Math.ceil(totalElements / LIMIT)

    } catch (e) {
        console.error("Failed to fetch given reviews", e)
    } finally {
        isLoading.value = false
    }
}

const nextPage = () => {
    if (page.value < totalPages.value - 1) {
        page.value++
        fetchReviews()
    }
}

const prevPage = () => {
    if (page.value > 0) {
        page.value--
        fetchReviews()
    }
}

onMounted(() => {
    fetchReviews()
})

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return dateStr.split('T')[0]
}
</script>

<template>
    <section
        class="h-full bg-[#1e1e1e]/80 border border-blue-500/30 p-6 flex flex-col relative overflow-hidden group/section rounded-2xl shadow-lg">
        <!-- Glow -->
        <div
            class="absolute inset-0 bg-blue-500/5 pointer-events-none group-hover/section:bg-blue-500/10 transition-colors">
        </div>

        <div class="flex justify-between items-center mb-4 shrink-0 relative z-10">
            <h3 class="text-blue-400 font-bold flex items-center gap-2">
                <PixelText>> SENT REVIEWS</PixelText>
            </h3>
            <div class="flex gap-2">
                <button @click="prevPage" :disabled="page === 0"
                    class="text-xs px-2 py-1 bg-gray-800 text-blue-400 border border-blue-900 disabled:opacity-30 hover:bg-gray-700 rounded-lg">&lt;</button>
                <span class="text-xs text-gray-500 self-center">{{ page + 1 }} / {{ totalPages || 1 }}</span>
                <button @click="nextPage" :disabled="page >= totalPages - 1"
                    class="text-xs px-2 py-1 bg-gray-800 text-blue-400 border border-blue-900 disabled:opacity-30 hover:bg-gray-700 rounded-lg">&gt;</button>
            </div>
        </div>

        <div v-if="isLoading" class="flex-1 flex items-center justify-center text-blue-500/50 animate-pulse text-xs">
            > UPLOADING_ARCHIVE...
        </div>

        <div v-else-if="reviews.length === 0" class="flex-1 flex items-center justify-center text-gray-600 text-xs">
            NO REVIEWS WRITTEN YET.
        </div>

        <div v-else class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar relative z-10">
            <div v-for="(rev, index) in reviews" :key="rev.reviewId"
                class="p-3 bg-black/40 border border-blue-900/50 flex flex-col gap-1 transition-all hover:bg-blue-900/10 animate-slide-fade-in rounded-xl"
                :style="{ animationDelay: `${index * 50}ms` }">

                <div class="flex justify-between items-center border-b border-blue-900/30 pb-1 mb-1">
                    <span class="text-xs text-blue-300 font-bold truncate">TO: {{ rev.nickname }}</span>
                    <span class="text-[10px] text-gray-500">{{ formatDate(rev.createdAt) }}</span>
                </div>

                <div class="flex justify-between items-start gap-4">
                    <p class="text-xs text-gray-300 line-clamp-2 break-all flex-1">"{{ rev.content }}"</p>
                    <div class="flex flex-col items-end shrink-0">
                        <span class="text-[10px] text-gray-500">{{ rev.problemTitle }}</span>
                        <span class="text-xs text-pink-400 font-bold">♥ {{ rev.likeCount }}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #2563eb;
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
