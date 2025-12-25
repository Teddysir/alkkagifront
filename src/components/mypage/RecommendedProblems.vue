<script setup>
import { ref, onMounted } from 'vue'
import { getTodayProblems } from '@/api/problem'
import PixelText from '@/components/PixelText.vue'

const problems = ref([])
const isLoading = ref(true)

const fetchTodayProblems = async () => {
    try {
        isLoading.value = true
        const res = await getTodayProblems()
        // API response structure: { message: "...", data: { problems: [...] } }
        problems.value = res.data?.problems || []
    } catch (e) {
        console.error('Failed to load today problems', e)
    } finally {
        isLoading.value = false
    }
}

const getDifficultyColor = (diff) => {
    if (!diff) return 'text-gray-500'
    const d = diff.toUpperCase()
    if (d.includes('BRONZE')) return 'text-orange-700'
    if (d.includes('SILVER')) return 'text-gray-400'
    if (d.includes('GOLD')) return 'text-yellow-500'
    if (d.includes('PLATINUM')) return 'text-green-400'
    if (d.includes('DIAMOND')) return 'text-blue-400'
    if (d.includes('RUBY')) return 'text-red-500'
    return 'text-gray-500'
}

const openProblem = (link) => {
    if (link) window.open(link, '_blank')
}

onMounted(() => {
    fetchTodayProblems()
})
</script>

<template>
    <div
        class="pixel-window bg-[#1e1e1e] border-2 border-green-900 p-4 h-full flex flex-col relative overflow-hidden group">
        <!-- Header -->
        <h3 class="text-green-400 font-bold flex items-center gap-2 mb-4 shrink-0">
            <PixelText>> TODAY'S MISSION</PixelText>
            <span class="text-[10px] text-gray-500 animate-pulse" v-if="!isLoading">UPDATING...</span>
        </h3>

        <!-- Content -->
        <div class="flex-1 min-h-0 flex flex-col gap-4">
            <div v-if="isLoading"
                class="flex-1 flex items-center justify-center text-green-500/50 text-xs animate-pulse">
                SCANNING SECTOR...
            </div>

            <div v-else-if="problems.length === 0"
                class="flex-1 flex items-center justify-center text-gray-600 text-xs">
                NO MISSIONS DETECTED.
            </div>

            <div v-else v-for="(p, idx) in problems" :key="p.id" @click="openProblem(p.problemLink)"
                class="flex-1 min-h-0 relative group/card cursor-pointer perspective-1000">

                <!-- Card Body -->
                <div
                    class="absolute inset-0 bg-black/80 border-2 border-gray-700 hover:border-green-400 transition-all duration-300 transform group-hover/card:-translate-y-1 group-hover/card:shadow-[0_0_15px_rgba(74,222,128,0.3)] flex flex-col p-4 overflow-hidden rounded-xl">

                    <!-- Background Grid Effect -->
                    <div
                        class="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_24%,rgba(34,197,94,0.3)_25%,rgba(34,197,94,0.3)_26%,transparent_27%,transparent_74%,rgba(34,197,94,0.3)_75%,rgba(34,197,94,0.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(34,197,94,0.3)_25%,rgba(34,197,94,0.3)_26%,transparent_27%,transparent_74%,rgba(34,197,94,0.3)_75%,rgba(34,197,94,0.3)_76%,transparent_77%,transparent)] bg-[length:30px_30px]">
                    </div>

                    <!-- Header -->
                    <div
                        class="relative z-10 flex justify-between items-center mb-2 border-b border-gray-800 pb-2 group-hover/card:border-green-500/30 transition-colors">
                        <span class="text-[10px] font-mono text-gray-400 group-hover/card:text-green-300">
                            MISSION #{{ idx + 1 }}
                        </span>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600"
                            :class="getDifficultyColor(p.difficultyType)">
                            {{ p.platformType }}
                        </span>
                    </div>

                    <!-- Title -->
                    <div class="relative z-10 flex-1 flex items-center">
                        <h4
                            class="text-gray-200 text-sm md:text-base font-bold leading-tight group-hover/card:text-white transition-colors line-clamp-2">
                            {{ p.title }}
                        </h4>
                    </div>

                    <!-- Footer / Action -->
                    <div
                        class="relative z-10 flex justify-between items-center mt-2 pt-2 border-t border-gray-800 group-hover/card:border-green-500/30 transition-colors">
                        <span class="text-[10px] font-bold" :class="getDifficultyColor(p.difficultyType)">
                            {{ p.difficultyType }}
                        </span>
                        <div
                            class="text-[10px] bg-gray-800 group-hover/card:bg-green-600 group-hover/card:text-black text-gray-500 px-2 py-1 transition-colors font-bold uppercase tracking-wider rounded">
                            START >
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scanlines -->
        <div
            class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] opacity-20">
        </div>
    </div>
</template>

<style scoped>
.pixel-window {
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #14532d;
}
</style>
