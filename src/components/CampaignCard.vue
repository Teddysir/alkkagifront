<script setup>
import { computed } from 'vue'

const props = defineProps({
    campaign: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        default: 'open' // open(In Progress), future(Coming Soon), closed
    }
})

const progress = computed(() => {
    if (!props.campaign.startDate || !props.campaign.endDate) return 0
    const now = new Date()
    const start = new Date(props.campaign.startDate)
    const end = new Date(props.campaign.endDate)
    if (now < start) return 0
    if (now > end) return 100
    const total = end - start
    const current = now - start
    return Math.floor((current / total) * 100)
})

const cardClasses = computed(() => {
    switch (props.status) {
        case 'closed': return 'opacity-70 grayscale border-gray-600'
        case 'future':
            // COMING SOON -> 초록색 테마 일치
            return 'border-[#4ADE80]/50 hover:border-[#4ADE80] hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]'
        case 'open':
            // IN PROGRESS -> 하늘색 테마 일치
            return 'border-sky-500/50 hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]'
        default: return ''
    }
})

const statusLabel = computed(() => {
    switch (props.status) {
        case 'future': return 'NOW JOIN'
        case 'closed': return 'FINISHED'
        case 'open': return 'IN PROGRESS'
        default: return 'VIEW'
    }
})

const thumbnailSrc = computed(() => {
    return props.campaign.thumbnail || props.campaign.image || props.campaign.imageUrl || null
})

const formatDate = (dateString) => {
    if (!dateString) return '00.00.00'
    const date = new Date(dateString)
    const y = String(date.getFullYear()).slice(-2)
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}.${m}.${d}`
}
</script>

<template>
    <div class="pixel-card flex flex-col w-full h-[340px] bg-[#0c0c0c] border-[2px] box-border transition-all duration-300 group relative overflow-hidden rounded-sm"
        :class="cardClasses">

        <div class="h-7 flex items-center justify-between px-3 bg-white/5 border-b border-white/10 z-30 relative">
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full" :class="{
                    'bg-sky-400 animate-ping': status === 'open',
                    'bg-[#4ADE80]': status === 'future',
                    'bg-gray-500': status === 'closed'
                }"></div>
                <span class="game-font text-[10px] text-white/50 tracking-widest uppercase">Protocol</span>
            </div>
            <div class="flex gap-1">
                <div class="w-3 h-[1px] bg-white/30"></div>
                <div class="w-1 h-[1px] bg-white/30"></div>
            </div>
        </div>

        <div class="flex-1 flex flex-col relative overflow-hidden">
            <div v-if="thumbnailSrc" class="absolute inset-0 z-0">
                <img :src="thumbnailSrc"
                    class="w-full h-full object-cover pixelated opacity-80 transition-transform duration-700 group-hover:scale-105" />
                <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0c0c0c]"></div>
            </div>

            <div class="z-20 p-4 pt-2 relative">
                <h3 class="text-white game-font text-sm md:text-lg leading-snug tracking-normal">
                    {{ campaign.title }}
                </h3>
            </div>

            <div
                class="absolute inset-x-0 bottom-0 z-10 h-[60%] bg-gradient-to-t from-[#0c0c0c] via-black/90 to-transparent flex items-start justify-end flex-col px-4 pb-32 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                <p class="text-gray-300 font-sans text-[14px] leading-relaxed line-clamp-3 drop-shadow-sm">
                    {{ campaign.description || 'No data available for this sector.' }}
                </p>
            </div>

            <div class="mt-auto z-20 p-4 relative">
                <div class="flex justify-between items-end mb-3">
                    <div class="flex flex-col">
                        <span class="text-[10px] game-font mb-1 opacity-80"
                            :class="status === 'open' ? 'text-sky-400' : 'text-[#4ADE80]'">TIME_WINDOW</span>
                        <span class="text-white font-mono text-sm font-medium tracking-tighter">
                            {{ formatDate(campaign.startDate) }} ~ {{ formatDate(campaign.endDate) }}
                        </span>
                    </div>
                    <span class="text-[10px] text-white/40 font-mono">{{ progress }}%</span>
                </div>

                <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                    <div class="h-full shadow-[0_0_10px] transition-all duration-1000 ease-out relative"
                        :class="status === 'open' ? 'bg-sky-500 shadow-sky-500' : 'bg-[#4ADE80] shadow-[#4ADE80]'"
                        :style="{ width: progress + '%' }">
                        <div
                            class="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-shimmer">
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center">
                    <div class="flex gap-1.5">
                        <div v-for="i in 5" :key="i" class="w-1 h-1 rounded-full"
                            :class="i / 5 <= progress / 100 ? (status === 'open' ? 'bg-sky-400' : 'bg-[#4ADE80]') : 'bg-white/10'">
                        </div>
                    </div>

                    <button class="status-btn px-4 py-1.5 text-[10px] font-bold game-font transition-all rounded-sm"
                        :class="{
                            'bg-sky-500 text-black hover:bg-sky-400 hover:scale-105 active:scale-95': status === 'open',
                            'bg-[#4ADE80] text-black hover:bg-[#3dbd6d] hover:scale-105 active:scale-95': status === 'future',
                            'bg-white/10 text-white/30 cursor-not-allowed': status === 'closed'
                        }">
                        {{ statusLabel }}
                    </button>
                </div>
            </div>

            <div v-if="status === 'closed'"
                class="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                <div class="px-4 py-1 border-y border-white/20 bg-black/40">
                    <span
                        class="text-white/40 game-font text-[10px] tracking-[0.3em] uppercase italic">Expedition_End</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap');

.game-font {
    font-family: 'Pixelify Sans', sans-serif;
}

.pixelated {
    image-rendering: pixelated;
}

.status-btn {
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(100%);
    }
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}
</style>