<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSubmissionList } from '@/api/submission'
import CommonHeader from '@/components/CommonHeader.vue'
import PixelText from '@/components/PixelText.vue'
import PixelButton from '@/components/PixelButton.vue'
import { useAlertStore } from '@/stores/alert'

const route = useRoute()
const router = useRouter()
const alertStore = useAlertStore()

const campaignId = route.params.campaignId
const problemId = route.params.problemId

const isLoading = ref(true)
const submissions = ref([])
const page = ref(0)
const totalPages = ref(1)
const sortOption = ref('createdAt')
const sortDirection = ref('desc')

const fetchSubmissions = async () => {
    try {
        isLoading.value = true
        const res = await getSubmissionList(problemId, {
            page: page.value,
            size: 10,
            sortBy: sortOption.value,
            sortDirection: sortDirection.value
        })

        const data = res.data?.data || res.data || {}
        submissions.value = data.content || []
        totalPages.value = data.page?.totalPages || 1
        page.value = data.page?.number || 0

    } catch (e) {
        console.error("Failed to load statistics", e)
        alertStore.showAlert('ERROR', 'FAILED TO LOAD STATS')
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

const goToSubmission = (submissionId) => {
    router.push(`/submission/${submissionId}`)
}

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
    fetchSubmissions()
})
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative overflow-hidden">
        <!-- Background -->
        <div class="absolute inset-0 z-0">
            <img src="@/assets/pixel_city_bg.png" class="w-full h-full object-cover opacity-60 fixed"
                alt="Cyberpunk City" />
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm fixed"></div>
        </div>

        <CommonHeader />

        <div
            class="relative z-10 flex-1 max-w-[1200px] mx-auto w-full p-6 lg:p-10 flex flex-col h-full overflow-hidden">
            <!-- Header -->
            <div class="flex justify-between items-end mb-6 border-b border-green-500/30 pb-4">
                <div>
                    <button @click="router.back()"
                        class="text-xs text-green-500 hover:text-white mb-2 flex items-center gap-1">
                        &lt; BACK TO CAMPAIGN
                    </button>
                    <h1 class="text-2xl md:text-3xl text-white">
                        <PixelText>> MISSION STATISTICS</PixelText>
                    </h1>
                </div>
                <div class="flex items-center gap-4">
                    <select v-model="sortOption" @change="fetchSubmissions"
                        class="bg-black text-xs text-green-500 border border-green-900 p-2 outline-none focus:border-green-500 font-bold uppercase">
                        <option value="createdAt">LATEST</option>
                        <option value="viewCount">VIEWS</option>
                    </select>
                </div>
            </div>

            <!-- Content -->
            <div
                class="flex-1 bg-[#1e1e1e]/90 border-2 border-green-500/50 pixel-window p-6 overflow-hidden flex flex-col">
                <div v-if="isLoading" class="flex-1 flex items-center justify-center text-green-500/50 animate-pulse">
                    > DOWNLOADING DATA...
                </div>

                <div v-else-if="submissions.length === 0"
                    class="flex-1 flex items-center justify-center text-gray-600 text-sm">
                    NO SUBMISSIONS FOUND FOR THIS SECTOR.
                </div>

                <div v-else class="flex-1 overflow-y-auto custom-scrollbar">
                    <table class="w-full text-left text-xs md:text-sm">
                        <thead class="text-green-500 border-b-2 border-green-500/30 sticky top-0 bg-[#1e1e1e] z-10">
                            <tr>
                                <th class="p-3">#</th>
                                <th class="p-3">DEV</th>
                                <th class="p-3">LANGUAGE</th>
                                <th class="p-3">STATUS</th>
                                <th class="p-3 text-right hidden md:table-cell">MEMORY</th>
                                <th class="p-3 text-right hidden md:table-cell">TIME</th>
                                <th class="p-3 text-right">DATE</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800">
                            <tr v-for="item in submissions" :key="item.submission.id"
                                @click="goToSubmission(item.submission.id)"
                                class="hover:bg-green-500/10 cursor-pointer transition-colors group">
                                <td class="p-3 font-mono text-gray-500">{{ item.submission.id }}</td>
                                <td class="p-3 flex items-center gap-2">
                                    <!-- <div
                                        class="w-6 h-6 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
                                        <img :src="item.user.profileImage || 'https://via.placeholder.com/30'"
                                            class="w-full h-full object-cover">
                                    </div> -->
                                    <span class="text-white font-bold group-hover:text-green-300">{{ item.user.nickname
                                        }}</span>
                                </td>
                                <td class="p-3">
                                    <span
                                        class="px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700 text-[10px] font-bold">
                                        {{ item.submission.language }}
                                    </span>
                                </td>
                                <td class="p-3">
                                    <span v-if="item.submission.isSuccess"
                                        class="text-green-500 font-bold">SUCCESS</span>
                                    <span v-else class="text-red-500 font-bold">FAILED</span>
                                </td>
                                <td class="p-3 text-right text-gray-400 hidden md:table-cell font-mono">{{
                                    (item.submission.memory / 1024).toFixed(0) }} KB</td>
                                <td class="p-3 text-right text-gray-400 hidden md:table-cell font-mono">{{
                                    item.submission.execTime }} ms</td>
                                <td class="p-3 text-right text-gray-500 font-mono">{{
                                    formatDate(item.submission.createdAt) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="flex justify-between items-center mt-4 pt-4 border-t border-green-500/20">
                    <button @click="prevPage" :disabled="page === 0"
                        class="text-xs px-3 py-1 bg-green-900/20 text-green-400 border border-green-900 disabled:opacity-30 hover:bg-green-900/50 transition-colors">
                        &lt; PREV
                    </button>
                    <span class="text-xs text-gray-500 font-mono">PAGE {{ page + 1 }} / {{ totalPages }}</span>
                    <button @click="nextPage" :disabled="page >= totalPages - 1"
                        class="text-xs px-3 py-1 bg-green-900/20 text-green-400 border border-green-900 disabled:opacity-30 hover:bg-green-900/50 transition-colors">
                        NEXT &gt;
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pixel-window {
    box-shadow: 8px 8px 0px #000000;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #22c55e;
    /* Green-500 */
}
</style>
