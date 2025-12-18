<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCampaigns } from '@/api/campaign'

const router = useRouter()
const isLoading = ref(true)

// Audio
const bgmAudio = ref(null)

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

const ITEMS_PER_PAGE = 4
const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

onMounted(async () => {
    // Start BGM with Fade In
    if (bgmAudio.value) {
        bgmAudio.value.volume = 0
        bgmAudio.value.play().catch(e => console.log('Autoplay blocked:', e))
        fadeInAudio()
    }

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

onUnmounted(() => {
    if (bgmAudio.value) {
        bgmAudio.value.pause()
        bgmAudio.value.currentTime = 0
    }
})

const fadeInAudio = () => {
    let vol = 0;
    const interval = setInterval(() => {
        if (!bgmAudio.value) {
            clearInterval(interval)
            return
        }
        if (vol < 1.0) {
            vol += 0.05
            bgmAudio.value.volume = Math.min(vol, 1.0)
        } else {
            clearInterval(interval)
        }
    }, 200) // Increase volume every 200ms
}

// Visual Helpers
const getIslandImage = (status) => {
    switch (status) {
        case 'future': return '/image/island_1.png'
        case 'closed': return '/image/island_3.png'
        default: return '/image/island_2.png'
    }
}

const getStatusLabel = (status) => {
    switch (status) {
        case 'future': return 'JOIN' // User requested JOIN for future (Coming Soon)
        case 'closed': return 'CLOSED'
        case 'open': return 'VIEW' // User requested VIEW for Open
        default: return 'VIEW'
    }
}

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

const handleIslandClick = (id) => {
    console.log('Clicked campaign', id)
}
</script>

<template>
    <div class="min-h-screen relative overflow-x-hidden font-mono select-none flex flex-col">

        <!-- Background Animation Layer -->
        <div class="absolute inset-0 z-0 bg-blue-900 pointer-events-none">
            <!-- Use classes to animate opacity -->
            <div class="absolute inset-0 bg-cover bg-center animate-bg-1"
                style="background-image: url('/image/mapback.png');"></div>
            <div class="absolute inset-0 bg-cover bg-center animate-bg-2"
                style="background-image: url('/image/mapback_2.png');"></div>
            <div class="absolute inset-0 bg-cover bg-center animate-bg-3"
                style="background-image: url('/image/mapback_3.png');"></div>
            <div class="absolute inset-0 bg-blue-900/30"></div>
        </div>

        <!-- Hidden Audio -->
        <audio ref="bgmAudio" loop src="/bgm.mp3"></audio>

        <!-- Header -->
        <nav
            class="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <button @click="router.push('/')"
                class="text-white text-3xl font-bold tracking-wider pixel-font hover:text-green-400 transition-colors drop-shadow-md pointer-events-auto">
                Alkkagi Map
            </button>
        </nav>

        <!-- Content Container -->
        <!-- justify-evenly to spread rows across full screen height -->
        <div class="relative z-10 w-full min-h-screen flex flex-col justify-evenly py-20 px-4 md:px-12">

            <div v-if="isLoading" class="text-white text-2xl animate-pulse pixel-font text-center">
                Loading Map...
            </div>

            <!-- ROW 1: FUTURE (Coming Soon) -->
            <!-- User requested: Top = Future (Coming Soon) -->
            <section v-if="!isLoading && futureCampaigns.length > 0" class="flex flex-col gap-2">
                <!-- <h2
                    class="text-gray-300 text-lg md:text-xl pixel-font tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)] ml-4">
                    COMING SOON
                </h2> -->
                <div class="flex items-center gap-4">
                    <button @click="prev('future')" :disabled="!canGoPrev('future')"
                        class="transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                        <img src="/image/left.png" class="w-10 h-10 pixel-art" />
                    </button>

                    <div class="flex-1 grid grid-cols-4 gap-4 min-h-[260px]">
                        <!-- Fixed min-height to prevent jumping -->
                        <div v-for="campaign in getVisibleItems('future')" :key="campaign.id"
                            class="relative flex flex-col items-center cursor-pointer group"
                            @click="handleIslandClick(campaign.id)">
                            <!-- Larger Island -->
                            <img :src="getIslandImage('future')"
                                class="w-full max-w-[280px] drop-shadow-2xl pixel-art grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                            <div class="absolute -bottom-6 flex flex-col items-center z-10">
                                <span class="text-gray-300 font-bold text-xs bg-black/60 px-2 truncate max-w-[150px]">{{
                                    campaign.title }}</span>
                                <span
                                    class="bg-gray-600 text-white text-[10px] px-2 py-0.5 border border-white mt-1 uppercase">{{
                                        getStatusLabel('future') }}</span>
                                <span class="text-[9px] text-gray-400 mt-0.5">{{ campaign.startDate.split('T')[0] }}
                                    OPEN</span>
                            </div>
                        </div>
                    </div>

                    <button @click="next('future')" :disabled="!canGoNext('future')"
                        class="transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                        <img src="/image/right.png" class="w-10 h-10 pixel-art" />
                    </button>
                </div>
            </section>

            <!-- ROW 2: OPEN (Adventure In Progress) -->
            <!-- Middle Row = In Progress -->
            <section v-if="!isLoading && openCampaigns.length > 0" class="flex flex-col gap-2">
                <!-- <h2
                    class="text-green-400 text-lg md:text-xl pixel-font tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)] ml-4">
                    ADVENTURE IN PROGRESS
                </h2> -->
                <div class="flex items-center gap-4">
                    <button @click="prev('open')" :disabled="!canGoPrev('open')"
                        class="transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                        <img src="/image/left.png" class="w-10 h-10 pixel-art" />
                    </button>

                    <div class="flex-1 grid grid-cols-4 gap-4 min-h-[260px]">
                        <div v-for="campaign in getVisibleItems('open')" :key="campaign.id"
                            class="relative flex flex-col items-center cursor-pointer group animate-float"
                            @click="handleIslandClick(campaign.id)">
                            <img :src="getIslandImage('open')"
                                class="w-full max-w-[280px] drop-shadow-2xl pixel-art hover:scale-105 transition-transform duration-300" />
                            <div class="absolute -bottom-6 flex flex-col items-center z-10">
                                <span class="text-white font-bold text-xs bg-black/60 px-2 truncate max-w-[150px]">{{
                                    campaign.title }}</span>
                                <span
                                    class="bg-red-500 text-white text-[10px] px-2 py-0.5 border border-white mt-1 uppercase">{{
                                        getStatusLabel('open') }}</span>
                            </div>
                        </div>
                    </div>

                    <button @click="next('open')" :disabled="!canGoNext('open')"
                        class="transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                        <img src="/image/right.png" class="w-10 h-10 pixel-art" />
                    </button>
                </div>
            </section>

            <!-- ROW 3: CLOSED (Archived) -->
            <!-- Bottom Row = Closed -->
            <section v-if="!isLoading && closedCampaigns.length > 0" class="flex flex-col gap-2">
                <!-- <h2
                    class="text-zinc-500 text-lg md:text-xl pixel-font tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)] ml-4">
                    ARCHIVED ISLES
                </h2> -->
                <div class="flex items-center gap-4">
                    <button @click="prev('closed')" :disabled="!canGoPrev('closed')"
                        class="transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                        <img src="/image/left.png" class="w-10 h-10 pixel-art" />
                    </button>

                    <div class="flex-1 grid grid-cols-4 gap-4 min-h-[260px]">
                        <div v-for="campaign in getVisibleItems('closed')" :key="campaign.id"
                            class="relative flex flex-col items-center cursor-pointer group"
                            @click="handleIslandClick(campaign.id)">
                            <img :src="getIslandImage('closed')"
                                class="w-full max-w-[280px] drop-shadow-2xl pixel-art brightness-50 hover:brightness-75 transition-all duration-300" />
                            <div class="absolute -bottom-6 flex flex-col items-center z-10">
                                <span class="text-gray-500 font-bold text-xs bg-black/60 px-2 truncate max-w-[150px]">{{
                                    campaign.title }}</span>
                                <span
                                    class="bg-zinc-700 text-gray-400 text-[10px] px-2 py-0.5 border border-gray-500 mt-1 uppercase">{{
                                        getStatusLabel('closed') }}</span>
                            </div>
                        </div>
                    </div>

                    <button @click="next('closed')" :disabled="!canGoNext('closed')"
                        class="transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                        <img src="/image/right.png" class="w-10 h-10 pixel-art" />
                    </button>
                </div>
            </section>

        </div>
    </div>
</template>

<style scoped>
.pixel-font {
    font-family: 'Courier New', Courier, monospace;
    text-shadow: 2px 2px 0px #000;
    font-weight: bold;
}

.pixel-art {
    image-rendering: pixelated;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-6px);
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

/* Background Animation Loop */
/* Total cycle: 3s? User said "actual wave feeling". Maybe slower. 
   Option: 
   Image 1: 0-33% opacity 1, then fade out.
   Image 2: 33-66% opacity 1, then fade out.
   Image 3: 66-100% opacity 1, then fade out.
   Or crossfade. 
   Let's try a simple 3-step animation.
*/
@keyframes bg-cycle-1 {

    0%,
    25% {
        opacity: 1;
    }

    33%,
    92% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

@keyframes bg-cycle-2 {

    0%,
    25% {
        opacity: 0;
    }

    33%,
    58% {
        opacity: 1;
    }

    66%,
    100% {
        opacity: 0;
    }
}

@keyframes bg-cycle-3 {

    0%,
    58% {
        opacity: 0;
    }

    66%,
    92% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}

/* Actually, let's keep it simple: 
   Frame 1: 0% -> 33% Visible
   Frame 2: 33% -> 66% Visible
   Frame 3: 66% -> 100% Visible
   Wait, they are frames of animation? "actually flowing waves". 
   If they are sequence frames, we should just toggle visibility rapidly or smoothly. 
   Let's try smooth crossfade. Cycle time 3s.
*/

.animate-bg-1 {
    animation: bgFrame1 1.5s infinite steps(1);
}

.animate-bg-2 {
    animation: bgFrame2 1.5s infinite steps(1);
}

.animate-bg-3 {
    animation: bgFrame3 1.5s infinite steps(1);
}

@keyframes bgFrame1 {
    0% {
        opacity: 1;
    }

    33.33% {
        opacity: 0;
    }

    100% {
        opacity: 0;
    }
}

@keyframes bgFrame2 {
    0% {
        opacity: 0;
    }

    33.33% {
        opacity: 1;
    }

    66.66% {
        opacity: 0;
    }
}

@keyframes bgFrame3 {
    0% {
        opacity: 0;
    }

    66.66% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}
</style>
