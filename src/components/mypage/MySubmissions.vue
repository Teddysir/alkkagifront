<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMySubmissions } from '@/api/submission'
import PixelText from '@/components/PixelText.vue'

const router = useRouter()
const submissions = ref([])
const page = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)
const hasError = ref(false)

const LIMIT = 6 // Reduced to 6 per page

const fetchSubmissions = async () => {
    try {
        isLoading.value = true
        hasError.value = false
        // Params: isSuccess, platform, sortBy, sortDirection, size, page
        const params = {
            page: page.value,
            size: LIMIT,
            sortBy: 'createdAt',
            sortDirection: 'desc'
        }

        const res = await getMySubmissions(params)
        const data = res.data // { content: [], page: {}, sort: {} }

        submissions.value = data.content || []
        const totalElements = data.page?.totalElements || 0
        totalPages.value = Math.ceil(totalElements / LIMIT)

    } catch (e) {
        console.error("Failed to fetch submissions", e)
        hasError.value = true
    } finally {
        isLoading.value = false
    }
}

const nextPage = () => {
    if (page.value < totalPages.value - 1) {
        page.value++
        fetchSubmissions()
    }
}

const prevPage = () => {
    if (page.value > 0) {
        page.value--
        fetchSubmissions()
    }
}

onMounted(() => {
    fetchSubmissions()
})

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return dateStr.split('T')[0]
}

const getPlatformColor = (type) => {
    switch (type) {
        case 'PROGRAMMERS': return 'text-blue-400'
        case 'BOJ': return 'text-orange-400'
        case 'SWEA': return 'text-purple-400'
        default: return 'text-gray-400'
    }
}

const getBadgeStyle = (algoName) => {
    // Simple color hashing or fixed styles
    return 'bg-gray-800 text-gray-300 border-gray-600'
}
</script>

<template>
    <div class="h-full flex flex-col gap-4">
        <!-- Filter Bar -->
        <div
            class="flex flex-wrap gap-2 items-center justify-between bg-[#1e1e1e]/80 p-3 rounded-xl border border-gray-700/50">

            <!-- Pagination Mini -->
            <div class="flex gap-2 items-center">
                <button @click="prevPage" :disabled="page === 0"
                    class="w-6 h-6 flex items-center justify-center bg-gray-800 text-white border border-gray-600 disabled:opacity-30 rounded hover:bg-gray-700">&lt;</button>
                <span class="text-xs text-gray-400 font-mono">{{ page + 1 }} / {{ totalPages || 1 }}</span>
                <button @click="nextPage" :disabled="page >= totalPages - 1"
                    class="w-6 h-6 flex items-center justify-center bg-gray-800 text-white border border-gray-600 disabled:opacity-30 rounded hover:bg-gray-700">&gt;</button>
            </div>
        </div>

        <!-- Content Area -->
        <div v-if="isLoading"
            class="flex-1 flex items-center justify-center text-green-500/50 animate-pulse font-mono tracking-widest">
            LOADING DATA...
        </div>

        <div v-else-if="hasError" class="flex-1 flex items-center justify-center text-red-500 font-mono text-sm">
            ERROR LOADING SUBMISSIONS.
        </div>

        <div v-else-if="submissions.length === 0"
            class="flex-1 flex items-center justify-center text-gray-500 font-mono text-sm">
            NO SUBMISSIONS FOUND.
        </div>

        <!-- Card Grid (Responsive: 1col -> 2cols -> 3cols) -->
        <div v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-2 content-start">

            <div v-for="(item, idx) in submissions" :key="item.submission.submissionId"
                @click="router.push(`/submission/${item.submission.submissionId}`)"
                class="group bg-[#151515] border border-gray-800 hover:border-green-500 hover:bg-[#1a1a1a] p-6 rounded-xl cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden animate-slide-up shadow-lg h-[220px] sm:h-[220px] lg:h-[220px]"
                :style="{ animationDelay: `${idx * 50}ms` }">

                <div
                    class="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/5 transition-colors pointer-events-none">
                </div>

                <div class="flex justify-between items-start z-10">
                    <span class="text-[10px] font-bold tracking-wider"
                        :class="getPlatformColor(item.problem.platformType)">
                        {{ item.problem.platformType }}
                    </span>
                    <span class="text-[10px] text-gray-600">{{ formatDate(item.submission.createAt) }}</span>
                </div>

                <div class="z-10 flex-1 min-h-0">
                    <h4
                        class="text-gray-200 font-bold text-sm line-clamp-1 leading-tight group-hover:text-green-400 transition-colors mb-1">
                        {{ item.problem.problemNo }}. {{ item.problem.title }}
                    </h4>
                    <div class="flex items-center gap-2 mb-2">
                        <div class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border"
                            :class="item.submission.isSuccess ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'">
                            {{ item.submission.isSuccess ? 'SOLVED' : 'FAILED' }}
                        </div>
                    </div>

                    <!-- Strategy Text -->
                    <p
                        class="text-[10px] text-gray-500 line-clamp-2 leading-relaxed h-[3em] overflow-hidden break-words">
                        {{ item.submission.strategy ? (item.submission.strategy.length > 30 ?
                            item.submission.strategy.slice(0, 30) + '...' :
                            item.submission.strategy) : 'No strategy recorded.' }}
                    </p>
                </div>

                <div
                    class="flex justify-between items-center text-[10px] text-gray-500 z-10 border-t border-gray-800 pt-2 mt-auto">
                    <div class="flex gap-2">
                        <span>{{ (item.submission.memory / 1024).toFixed(0) }}KB</span>
                        <span>{{ item.submission.execTime }}ms</span>
                    </div>
                    <span class="font-mono text-yellow-600">{{ item.submission.language }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4ade80;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slide-up {
    animation: slideUp 0.3s ease-out forwards;
}
</style>
