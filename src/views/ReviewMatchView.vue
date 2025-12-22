<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getReviewMatches } from '@/api/review'
import CommonHeader from '@/components/CommonHeader.vue'
import PixelText from '@/components/PixelText.vue'
import ReviewMatchCard from '@/components/review/ReviewMatchCard.vue'

const route = useRoute()
const router = useRouter()
const campaignProblemId = route.params.problemId

const isLoading = ref(true)
const matchData = ref(null)



const step1 = ref(false) // Left Column
const step2 = ref(false) // Left Connector
const step3 = ref(false) // Center (Me)
const step4 = ref(false) // Right Connector
const step5 = ref(false) // Right Column

const fetchData = async () => {
    try {
        isLoading.value = true
        const response = await getReviewMatches(campaignProblemId)
        if (response.data && response.data.data) {
            matchData.value = response.data.data
        } else {
            matchData.value = response.data
        }

        // Start Staggered Animation after data load
        isLoading.value = false
        setTimeout(() => step1.value = true, 100)
        setTimeout(() => step2.value = true, 100)
        setTimeout(() => step3.value = true, 200)
        setTimeout(() => step4.value = true, 200)
        setTimeout(() => step5.value = true, 300)

    } catch (error) {
        console.error("Failed to fetch matches", error)
        alert("Failed to load match data.")
        isLoading.value = false
    }
}

onMounted(() => {
    fetchData()
})

// 부드러운 S-곡선을 그리는 함수
const getConnectorPath = (index, total, side) => {
    const itemY = ((index + 0.5) / total) * 100;
    const centerY = 50;
    const midX = 50;

    if (side === 'left') {
        // 왼쪽(Reviewers) -> 중앙(Me): x-y-x Manhattan
        // End slightly before 100 to account for marker
        return `M 0 ${itemY} L ${midX} ${itemY} L ${midX} ${centerY} L 99 ${centerY}`;
    } else {
        // 중앙(Me) -> 오른쪽(Targets): x-y-x Manhattan
        // End slightly before 100 to account for marker
        return `M 0 ${centerY} L ${midX} ${centerY} L ${midX} ${itemY} L 99 ${itemY}`;
    }
}
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative overflow-hidden">
        <div class="absolute inset-0 z-0 bg-[#0a0a0a]">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000000_100%)]"></div>
            <div class="fixed inset-0 opacity-20 pointer-events-none"
                style="background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 20px 20px;">
            </div>
        </div>

        <CommonHeader />

        <div v-if="isLoading" class="relative z-10 flex-1 flex items-center justify-center">
            <div class="text-green-500 animate-pulse text-xl font-bold">
                <PixelText>> ANALYZING_MATCH_MATRIX..._</PixelText>
            </div>
        </div>

        <div v-else-if="matchData"
            class="relative z-10 flex-1 flex flex-col items-center justify-start p-4 md:p-8 overflow-hidden">

            <!-- Main Container -->
            <div
                class="flex flex-col xl:flex-row items-stretch justify-center gap-0 w-full max-w-[1600px] h-[75vh] px-8">

                <!-- LEFT: REVIEWERS -->
                <div class="flex flex-col items-center z-30 relative w-72 md:w-96 shrink-0 h-full transition-all duration-700 ease-out transform"
                    :class="step1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'">
                    <!-- Header Area -->
                    <div class="h-16 flex flex-col justify-center items-center mb-4">
                        <div class="text-center text-blue-400 font-bold opacity-80">
                            <PixelText variant="title">REVIEWERS</PixelText>
                            <div
                                class="inline-flex justify-center items-center ml-2 px-2 py-0.5 bg-blue-900/50 border border-blue-500/50 rounded text-[10px] text-blue-300">
                                {{ matchData.reviewerList ? matchData.reviewerList.length : 0 }}
                            </div>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="flex-1 w-full flex flex-col justify-around items-center">
                        <template v-for="match in matchData.reviewerList" :key="match.matchId">
                            <ReviewMatchCard :match="match" type="REVIEWER" />
                        </template>
                    </div>
                </div>

                <!-- LEFT CONNECTOR -->
                <div class="hidden xl:flex flex-col flex-1 relative z-10 h-full min-w-[150px] transition-all duration-700 ease-out delay-100"
                    :class="step2 ? 'opacity-100' : 'opacity-0'">
                    <!-- Spacer matching Header Area -->
                    <div class="h-16 mb-4"></div>
                    <!-- SVG Area matching Content Area -->
                    <div class="flex-1 relative w-full">
                        <svg class="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100"
                            preserveAspectRatio="none">
                            <defs>
                                <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="5" refY="3"
                                    orient="auto">
                                    <path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa" />
                                </marker>
                            </defs>
                            <path v-for="(match, idx) in matchData.reviewerList" :key="'l-' + idx"
                                :d="getConnectorPath(idx, matchData.reviewerList.length, 'left')" fill="none"
                                stroke="#60a5fa" stroke-width="0.8" vector-effect="non-scaling-stroke"
                                marker-end="url(#arrow-blue)" class="animate-flow" stroke-linecap="round" />
                        </svg>
                    </div>
                </div>

                <!-- CENTER: ME -->
                <div class="flex flex-col items-center z-30 relative w-72 md:w-96 shrink-0 h-full transition-all duration-700 ease-out transform"
                    :class="step3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'">
                    <!-- Header Area -->
                    <div class="h-16 flex flex-col justify-center items-center mb-4">
                        <div class="text-center text-green-400 font-bold">
                            <PixelText variant="title">ME</PixelText>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="flex-1 w-full flex items-center justify-center">
                        <!-- ME CARD: Normal scale, relies on Card's own hover effect -->
                        <div class="relative group">
                            <div
                                class="absolute -inset-10 bg-green-500/10 blur-2xl rounded-full opacity-50 animate-pulse">
                            </div>
                            <ReviewMatchCard v-if="matchData.myReview" :match="matchData.myReview" type="ME"
                                class="shadow-[0_0_40px_rgba(74,222,128,0.15)] ring-1 ring-green-500/50" />
                            <div v-else class="text-gray-500 text-xs text-center border p-4 w-72">No Submission</div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT CONNECTOR -->
                <div class="hidden xl:flex flex-col flex-1 relative z-10 h-full min-w-[150px] transition-all duration-700 ease-out delay-100"
                    :class="step4 ? 'opacity-100' : 'opacity-0'">
                    <!-- Spacer matching Header Area -->
                    <div class="h-16 mb-4"></div>
                    <!-- SVG Area matching Content Area -->
                    <div class="flex-1 relative w-full">
                        <svg class="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100"
                            preserveAspectRatio="none">
                            <defs>
                                <marker id="arrow-purple" markerWidth="6" markerHeight="6" refX="5" refY="3"
                                    orient="auto">
                                    <path d="M0,0 L6,3 L0,6 Z" fill="#a855f7" />
                                </marker>
                            </defs>
                            <path v-for="(match, idx) in matchData.revieweeList" :key="'r-' + idx"
                                :d="getConnectorPath(idx, matchData.revieweeList.length, 'right')" fill="none"
                                stroke="#a855f7" stroke-width="0.8" vector-effect="non-scaling-stroke"
                                marker-end="url(#arrow-purple)" class="animate-flow" stroke-linecap="round" />
                        </svg>
                    </div>
                </div>

                <!-- RIGHT: REVIEWEES -->
                <div class="flex flex-col items-center z-30 relative w-72 md:w-96 shrink-0 h-full transition-all duration-700 ease-out transform"
                    :class="step5 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'">
                    <!-- Header Area -->
                    <div class="h-16 flex flex-col justify-center items-center mb-4">
                        <div class="text-center text-purple-400 font-bold opacity-80">
                            <PixelText variant="title">REVIEWEES</PixelText>
                            <div
                                class="inline-flex justify-center items-center ml-2 px-2 py-0.5 bg-purple-900/50 border border-purple-500/50 rounded text-[10px] text-purple-300">
                                {{ matchData.revieweeList ? matchData.revieweeList.length : 0 }}
                            </div>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="flex-1 w-full flex flex-col justify-around items-center">
                        <template v-for="match in matchData.revieweeList" :key="match.matchId">
                            <ReviewMatchCard :match="match" type="REVIEWEE" />
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="relative z-10 flex-1 flex items-center justify-center text-red-500">
            <PixelText>> ERROR_LOADING_DATA</PixelText>
        </div>
    </div>
</template>

<style scoped>
@keyframes flow {
    0% {
        stroke-dashoffset: 20;
    }

    100% {
        stroke-dashoffset: 0;
    }
}

.animate-flow {
    animation: flow 1s linear infinite;
    stroke-dasharray: 4 4;
}

/* 스크롤바 커스텀 */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #0a0a0a;
}

::-webkit-scrollbar-thumb {
    background: #222;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #333;
}
</style>