<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PixelText from '@/components/PixelText.vue'

const router = useRouter()
const props = defineProps({
    match: Object, // The match object containing submissionDetailResponseDto and userInfoResponseDto
    type: String // 'REVIEWER', 'ME', 'REVIEWEE'
})

const user = props.match?.userInfoResponseDto
const sub = props.match?.submissionDetailResponseDto

const truncatedStrategy = computed(() => {
    if (!sub?.strategy) return ''
    return sub.strategy.length > 25 ? sub.strategy.substring(0, 25) + '...' : sub.strategy
})

const goToDetail = () => {
    console.log("Card clicked", sub)
    const targetId = sub?.id || sub?.submissionId
    if (targetId) {
        console.log("Navigating to", targetId)
        router.push(`/submission/${targetId}`)
    } else {
        console.warn("No submission ID found for navigation", sub)
    }
}

const getTypeColor = () => {
    if (props.type === 'ME') return 'border-green-500 bg-green-950'
    if (props.type === 'REVIEWER') return 'border-blue-500 bg-blue-950'
    if (props.type === 'REVIEWEE') return 'border-purple-500 bg-purple-950'
    return 'border-gray-500'
}

const getTextColor = () => {
    if (props.type === 'ME') return 'text-green-400'
    if (props.type === 'REVIEWER') return 'text-blue-400'
    if (props.type === 'REVIEWEE') return 'text-purple-400'
    return 'text-gray-400'
}
</script>

<template>
    <div class="pixel-card relative p-3 border-2 flex flex-col gap-2 w-72 md:w-96 transition-all duration-300 hover:scale-105 group cursor-pointer"
        :class="[getTypeColor(), 'hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]']" @click="goToDetail">

        <!-- Corner Accents for Pixel Look -->
        <div class="absolute -top-[2px] -left-[2px] w-1.5 h-1.5 bg-[#0a0a0a] z-10"></div>
        <div class="absolute -top-[2px] -right-[2px] w-1.5 h-1.5 bg-[#0a0a0a] z-10"></div>
        <div class="absolute -bottom-[2px] -left-[2px] w-1.5 h-1.5 bg-[#0a0a0a] z-10"></div>
        <div class="absolute -bottom-[2px] -right-[2px] w-1.5 h-1.5 bg-[#0a0a0a] z-10"></div>

        <!-- Inner Border for Depth -->
        <div class="absolute inset-0.5 border border-white/5 pointer-events-none"></div>

        <!-- Header: Role & User -->
        <div class="flex items-center gap-3 border-b border-gray-700 pb-2 relative z-0">
            <div
                class="w-8 h-8 rounded bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden group-hover:border-white/50 transition-colors">
                <img v-if="user?.profileImage" :src="user.profileImage" class="w-full h-full object-cover">
                <span v-else class="text-xs text-gray-400">{{ user?.nickname?.charAt(0) }}</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-[10px] font-bold opacity-70" :class="getTextColor()">{{ type }}</div>
                <div class="text-sm text-white font-bold truncate group-hover:text-green-300 transition-colors">{{
                    user?.nickname }}</div>
            </div>
            <div v-if="sub"
                class="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-white shadow-sm group-hover:bg-gray-700 transition-colors">
                {{ sub?.language }}
            </div>
        </div>

        <!-- Submission Info -->
        <div class="space-y-2 relative z-0" v-if="sub">
            <div class="flex flex-wrap gap-1">
                <span v-for="algo in sub.algorithmList" :key="algo.id"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 border border-gray-700">
                    {{ algo.name }}
                </span>
            </div>

            <!-- Strategy -->
            <div
                class="mt-1 bg-black/30 p-2 rounded border border-gray-700/50 group-hover:border-white/20 transition-colors">
                <p class="text-[10px] text-gray-400 leading-relaxed">
                    {{ truncatedStrategy }}
                </p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-1 mt-1 border-t border-gray-800/50 pt-1">
                <div
                    class="flex flex-col items-center p-1 bg-gray-900/50 rounded group-hover:bg-gray-800/50 transition-colors">
                    <span class="text-[8px] text-gray-500 uppercase">Time</span>
                    <span class="text-[10px] font-mono text-white">{{ sub.execTime }}<span
                            class="text-[8px] text-gray-600">ms</span></span>
                </div>
                <div
                    class="flex flex-col items-center p-1 bg-gray-900/50 rounded group-hover:bg-gray-800/50 transition-colors">
                    <span class="text-[8px] text-gray-500 uppercase">Mem</span>
                    <span class="text-[10px] font-mono text-white">{{ Math.round(sub.memory / 1024) }}<span
                            class="text-[8px] text-gray-600">MB</span></span>
                </div>
                <div
                    class="flex flex-col items-center p-1 bg-gray-900/50 rounded group-hover:bg-gray-800/50 transition-colors">
                    <span class="text-[8px] text-gray-500 uppercase">Result</span>
                    <span class="text-[10px] font-bold" :class="sub.isSuccess ? 'text-green-500' : 'text-red-500'">
                        {{ sub.isSuccess ? 'PASS' : 'FAIL' }}
                    </span>
                </div>
            </div>
        </div>
        <div v-else class="py-4 text-center text-xs text-gray-600 italic">
            No Submission Data
        </div>

        <!-- Outer Rects for Pixel Border Effect -->
        <div class="absolute -top-[2px] left-[4px] right-[4px] h-[2px] bg-current opacity-50" :class="getTextColor()">
        </div>
        <div class="absolute -bottom-[2px] left-[4px] right-[4px] h-[2px] bg-current opacity-50"
            :class="getTextColor()"></div>
        <div class="absolute top-[4px] bottom-[4px] -left-[2px] w-[2px] bg-current opacity-50" :class="getTextColor()">
        </div>
        <div class="absolute top-[4px] bottom-[4px] -right-[2px] w-[2px] bg-current opacity-50" :class="getTextColor()">
        </div>
    </div>
</template>

<style scoped>
.pixel-card {
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.3);
}

.pixel-card:hover {
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.1), 4px 4px 0px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.3);
}
</style>
