<script setup>
import { computed } from 'vue'

const props = defineProps({
    campaign: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        default: 'open' // open, future, closed
    }
})

// Visual variants based on status
const cardClasses = computed(() => {
    switch (props.status) {
        case 'closed':
            return 'opacity-60 grayscale'
        case 'future':
            return 'opacity-80'
        case 'open':
            return 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(74,222,128,0.5)]'
        default:
            return ''
    }
})

const statusLabel = computed(() => {
    switch (props.status) {
        case 'future': return 'LOCKED'
        case 'closed': return 'CLOSED'
        case 'open': return 'START'
        default: return 'VIEW'
    }
})

// Thumbnail fallback
const thumbnailSrc = computed(() => {
    return props.campaign.thumbnail || props.campaign.image || props.campaign.imageUrl || null
})
</script>

<template>
    <div class="pixel-window flex flex-col w-full h-auto bg-[#1e1e1e] border-2 border-gray-400 box-border transition-all duration-200 group relative"
        :class="cardClasses">

        <!-- Header Bar (Retro Window Style) -->
        <div class="h-8 flex border-b-2 border-gray-400 bg-gray-300">
            <!-- Segment 1: +++ -->
            <div class="w-1/6 border-r-2 border-gray-400 flex items-center justify-center bg-[#1e1e1e]">
                <span class="text-white pixel-font text-[10px] tracking-tighter">+++</span>
            </div>
            <!-- Segment 2: xxx -->
            <div class="w-1/4 border-r-2 border-gray-400 flex items-center justify-center bg-gray-300">
                <span class="text-black pixel-font text-[10px] tracking-widest">xxx</span>
            </div>
            <!-- Segment 3: Bars -->
            <div
                class="flex-1 border-r-2 border-gray-400 flex items-center justify-center bg-[#1e1e1e] px-1 overflow-hidden">
                <div class="flex gap-1 w-full justify-center">
                    <div class="w-2 h-4 bg-gray-500"></div>
                    <div class="w-2 h-4 bg-gray-500"></div>
                    <div class="w-2 h-4 bg-white/50"></div>
                    <div class="w-2 h-4 bg-gray-500"></div>
                    <div class="w-2 h-4 bg-gray-500"></div>
                </div>
            </div>
            <!-- Segment 4: Controls -->
            <div class="w-1/5 flex items-center justify-center bg-gray-300 gap-1 px-1">
                <span class="text-black font-bold text-xs leading-none">-</span>
                <div class="w-3 h-3 border border-black"></div>
                <span class="text-black font-bold text-xs leading-none">x</span>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 p-3 flex flex-col justify-between relative overflow-hidden bg-[#1e1e1e]">
            <!-- Thumbnail Background (optional) -->
            <div v-if="thumbnailSrc" class="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <img :src="thumbnailSrc" class="w-full h-full object-cover" />
            </div>

            <!-- Title Section -->
            <div class="z-10 bg-[#1e1e1e]/80 border-b border-dashed border-gray-600 pb-2 mb-2 backdrop-blur-sm">
                <h3 class="text-white pixel-font text-xs md:text-sm leading-tight line-clamp-2">
                    {{ campaign.title }}
                </h3>
            </div>

            <!-- Info Section -->
            <div class="z-10 flex-1 flex flex-col justify-center gap-1 text-[10px] md:text-xs text-gray-400 font-sans">
                <div class="flex items-center gap-2">
                    <span class="text-green-500">Start:</span>
                    <span>{{ campaign.startDate?.split('T')[0] }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-red-400">End:</span>
                    <span>{{ campaign.endDate?.split('T')[0] }}</span>
                </div>
            </div>

            <!-- Bottom Action Row -->
            <div class="z-10 mt-3 flex justify-between items-center bg-[#1e1e1e]/90 p-1 border border-gray-700">
                <div class="w-2 h-2 bg-green-500 animate-pulse rounded-full" v-if="status === 'open'"></div>
                <div class="w-2 h-2 bg-red-500" v-else-if="status === 'closed'"></div>
                <div class="w-2 h-2 bg-yellow-500" v-else></div>

                <div class="flex-1 mx-2 h-[1px] bg-gray-700"></div>

                <button class="px-2 py-1 text-[10px] font-bold uppercase transition-colors pixel-font" :class="{
                    'bg-green-600 text-white hover:bg-green-500': status === 'open',
                    'bg-gray-700 text-gray-400 cursor-not-allowed': status !== 'open'
                }">
                    {{ statusLabel }}
                </button>
            </div>

            <!-- Closed Overlay for content -->
            <div v-if="status === 'closed'"
                class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/40 backdrop-grayscale">
                <div class="bg-red-900/80 border-2 border-red-500 px-2 py-1 -rotate-12">
                    <span class="text-red-200 pixel-font text-xs">CLOSED</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pixel-font {
    font-family: 'Press Start 2P', cursive;
}

.pixel-window {
    box-shadow: 4px 4px 0px #000000;
    /* Deep shadow for the window itself */
    image-rendering: pixelated;
}
</style>
