<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCampaigns } from '@/api/campaign'
import CampaignCard from '@/components/CampaignCard.vue'
import CommonHeader from '@/components/CommonHeader.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)

// Data Groups
const openCampaigns = ref([])
const futureCampaigns = ref([])
const closedCampaigns = ref([])

// Pagination State
const pageIndices = ref({
    open: 0,
    future: 0,
    closed: 0
})

const ITEMS_PER_PAGE = 3
const today = new Date().toISOString().split('T')[0]

onMounted(async () => {
    try {
        const response = await fetchCampaigns()
        const list = response.data || []

        list.forEach(c => {
            const start = c.startDate.split('T')[0]
            const end = c.endDate.split('T')[0]

            if (today < start) {
                futureCampaigns.value.push({ ...c, status: 'future' })
            } else if (today > end) {
                closedCampaigns.value.push({ ...c, status: 'closed' })
            } else {
                openCampaigns.value.push({ ...c, status: 'open' })
            }
        })

    } catch (error) {
        console.error('Failed to fetch campaigns:', error)
    } finally {
        isLoading.value = false
    }
})

// Carousel Logic
const getVisibleItems = (groupKey) => {
    const source = groupKey === 'open' ? openCampaigns.value
        : groupKey === 'future' ? futureCampaigns.value
            : closedCampaigns.value

    const start = pageIndices.value[groupKey] * ITEMS_PER_PAGE
    return source.slice(start, start + ITEMS_PER_PAGE)
}

const canGoNext = (groupKey) => {
    const source = groupKey === 'open' ? openCampaigns.value
        : groupKey === 'future' ? futureCampaigns.value
            : closedCampaigns.value
    return (pageIndices.value[groupKey] + 1) * ITEMS_PER_PAGE < source.length
}

const canGoPrev = (groupKey) => {
    return pageIndices.value[groupKey] > 0
}

const next = (groupKey) => {
    if (canGoNext(groupKey)) pageIndices.value[groupKey]++
}

const prev = (groupKey) => {
    if (canGoPrev(groupKey)) pageIndices.value[groupKey]--
}

const handleCardClick = (campaign) => {
    if (campaign.status === 'open') {
        const quizId = campaign.quizId || campaign.id
        // router.push(`/quiz/${quizId}`) 
        console.log('Open campaign clicked', campaign)
    }
}
</script>

<template>
    <div
        class="min-h-screen bg-[#1e1e1e] text-[#d4d4d4] font-mono flex flex-col overflow-hidden relative selection:bg-green-500/30">

        <!-- Background Grid Pattern -->
        <div class="absolute inset-0 pointer-events-none opacity-20"
            style="background-image: radial-gradient(#4a4a4a 2px, transparent 2px); background-size: 16px 16px;">
        </div>

        <!-- Common Header -->
        <CommonHeader />

        <!-- Main Content -->
        <div
            class="relative z-10 flex-1 flex flex-col justify-start gap-8 py-8 px-4 md:px-12 max-w-[1400px] mx-auto w-full overflow-y-auto">

            <div v-if="isLoading" class="text-center text-green-500 animate-pulse mt-20 text-xl font-bold">
                > INITIALIZING_SYSTEM..._
            </div>

            <!-- Sections -->
            <template v-else>

                <!-- FUTURE -->
                <section class="flex flex-col gap-2">
                    <div class="flex items-center gap-3 mb-1 px-2 border-l-4 border-yellow-600">
                        <h2 class="text-base text-yellow-600 font-bold tracking-widest pixel-font">COMING SOON</h2>
                        <span class="text-xs text-gray-600">// LOCKED_ZONES</span>
                    </div>

                    <div class="flex items-center gap-2 md:gap-4">
                        <button @click="prev('future')" :disabled="!canGoPrev('future')" class="nav-arrow group"
                            :class="{ 'opacity-20 cursor-not-allowed': !canGoPrev('future') }">
                            <span class="group-active:translate-x-[-2px]">&lt;</span>
                        </button>

                        <div class="flex-1 grid grid-cols-3 gap-4 md:gap-6 min-h-[350px]">
                            <CampaignCard v-for="c in getVisibleItems('future')" :key="c.id" :campaign="c"
                                :status="'future'" @click="handleCardClick(c)" />
                            <!-- Placeholders -->
                            <div v-if="getVisibleItems('future').length < ITEMS_PER_PAGE"
                                v-for="n in (ITEMS_PER_PAGE - getVisibleItems('future').length)"
                                class="border-2 border-dashed border-gray-800 rounded opacity-30 flex items-center justify-center min-h-[350px]">
                                <span class="text-gray-800 text-4xl">+</span>
                            </div>
                        </div>

                        <button @click="next('future')" :disabled="!canGoNext('future')" class="nav-arrow group"
                            :class="{ 'opacity-20 cursor-not-allowed': !canGoNext('future') }">
                            <span class="group-active:translate-x-[2px]">&gt;</span>
                        </button>
                    </div>
                </section>

                <!-- OPEN -->
                <section class="flex flex-col gap-2">
                    <div class="flex items-center gap-3 mb-1 px-2 border-l-4 border-green-500">
                        <h2 class="text-base text-green-500 font-bold tracking-widest pixel-font">IN PROGRESS</h2>
                        <span class="text-xs text-gray-500">// ACTIVE_MISSIONS</span>
                    </div>

                    <div class="flex items-center gap-2 md:gap-4">
                        <button @click="prev('open')" :disabled="!canGoPrev('open')" class="nav-arrow group"
                            :class="{ 'opacity-20 cursor-not-allowed': !canGoPrev('open') }">
                            <span class="group-active:translate-x-[-2px]">&lt;</span>
                        </button>

                        <div class="flex-1 grid grid-cols-3 gap-4 md:gap-6 min-h-[350px]">
                            <CampaignCard v-for="c in getVisibleItems('open')" :key="c.id" :campaign="c"
                                :status="'open'" @click="handleCardClick(c)" />
                            <div v-if="getVisibleItems('open').length < ITEMS_PER_PAGE"
                                v-for="n in (ITEMS_PER_PAGE - getVisibleItems('open').length)"
                                class="border-2 border-dashed border-gray-800 rounded opacity-30 flex items-center justify-center min-h-[350px]">
                                <span class="text-gray-800 text-4xl">+</span>
                            </div>
                        </div>

                        <button @click="next('open')" :disabled="!canGoNext('open')" class="nav-arrow group"
                            :class="{ 'opacity-20 cursor-not-allowed': !canGoNext('open') }">
                            <span class="group-active:translate-x-[2px]">&gt;</span>
                        </button>
                    </div>
                </section>

                <!-- CLOSED -->
                <section class="flex flex-col gap-2">
                    <div class="flex items-center gap-3 mb-1 px-2 border-l-4 border-gray-500">
                        <h2 class="text-base text-gray-500 font-bold tracking-widest pixel-font">ARCHIVED</h2>
                        <span class="text-xs text-gray-600">// PAST_LOGS</span>
                    </div>

                    <div class="flex items-center gap-2 md:gap-4">
                        <button @click="prev('closed')" :disabled="!canGoPrev('closed')" class="nav-arrow group"
                            :class="{ 'opacity-20 cursor-not-allowed': !canGoPrev('closed') }">
                            <span class="group-active:translate-x-[-2px]">&lt;</span>
                        </button>

                        <div class="flex-1 grid grid-cols-3 gap-4 md:gap-6 min-h-[350px]">
                            <CampaignCard v-for="c in getVisibleItems('closed')" :key="c.id" :campaign="c"
                                :status="'closed'" @click="handleCardClick(c)" />
                            <div v-if="getVisibleItems('closed').length < ITEMS_PER_PAGE"
                                v-for="n in (ITEMS_PER_PAGE - getVisibleItems('closed').length)"
                                class="border-2 border-dashed border-gray-800 rounded opacity-30 flex items-center justify-center min-h-[350px]">
                                <span class="text-gray-800 text-4xl">+</span>
                            </div>
                        </div>

                        <button @click="next('closed')" :disabled="!canGoNext('closed')" class="nav-arrow group"
                            :class="{ 'opacity-20 cursor-not-allowed': !canGoNext('closed') }">
                            <span class="group-active:translate-x-[2px]">&gt;</span>
                        </button>
                    </div>
                </section>

            </template>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pixel-font {
    font-family: 'Press Start 2P', cursive;
    /* text-shadow removed for cleaner look */
}

.pixel-art {
    image-rendering: pixelated;
}

.nav-arrow {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #18181b;
    /* zinc-900 */
    border: 2px solid #3f3f46;
    /* zinc-700 */
    color: #a1a1aa;
    font-family: 'Press Start 2P', cursive;
    font-size: 1rem;
    transition: all 0.1s;
    box-shadow: 4px 4px 0px #000;
    flex-shrink: 0;
}

.nav-arrow:hover:not(:disabled) {
    border-color: #52525b;
    color: white;
}
</style>
