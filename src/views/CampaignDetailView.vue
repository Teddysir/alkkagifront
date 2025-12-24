<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCampaignDetail, getCampaignProblems, searchProblems, addCampaignProblems, deleteCampaignProblem, joinCampaign, withdrawCampaign, getCampaignUserStatus } from '@/api/campaign'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alert'
import CommonHeader from '@/components/CommonHeader.vue'
import PixelText from '@/components/PixelText.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const alertStore = useAlertStore()
const campaignId = route.params.id

const isLoading = ref(true)
const campaign = ref(null)
const problems = ref([])
const userStatus = ref(null)

// Admin Modal State
const showAddModal = ref(false)
const searchPlatform = ref('BOJ')
const searchKeyword = ref('')
const searchResults = ref([])
const newProblems = ref([])
const newProblemDates = ref({})

// Animation references
const problemElements = ref([])
const observer = ref(null)
// ... (omitted similar lines)

// ...

const fetchData = async () => {
    try {
        isLoading.value = true
        const promises = [
            getCampaignDetail(campaignId),
            getCampaignProblems(campaignId, { limit: 40 })
        ]

        // 인증된 경우에만 유저 상태 조회
        if (authStore.isAuthenticated) {
            promises.push(getCampaignUserStatus(campaignId).catch(() => null))
        }

        const [detailRes, problemsRes, statusRes] = await Promise.all(promises)

        campaign.value = detailRes.data
        problems.value = problemsRes.data?.content || problemsRes.data || []

        // 상태값이 null이거나 API 에러가 나도 null로 유지하여 접근 허용
        if (statusRes && statusRes.data) {
            userStatus.value = statusRes.data.campaignUserStatus // 'ACTIVE', 'WITHDRAWN' 등
        } else {
            userStatus.value = null
        }

    } catch (error) {
        console.error('Failed to load detail:', error)
        // 캠페인 정보 자체를 못 가져올 때만 리다이렉트
        router.push('/campaigns')
    } finally {
        isLoading.value = false
    }
}

// Rewatch auth changes (e.g. reload or late login)
watch(() => authStore.isAuthenticated, (newVal) => {
    if (newVal) fetchData()
})

// Button Logic
const canJoin = computed(() => {
    // 1. 캠페인 데이터가 없거나 관리자면 미노출
    if (!campaign.value || authStore.isAdmin) return false

    // 2. 참여 가능 기간 체크 (시작일 ~ 종료일 사이)
    const now = new Date()
    const startDate = new Date(campaign.value.startDate)
    const endDate = new Date(campaign.value.endDate)
    const isRunning = now >= startDate && now <= endDate

    if (!isRunning) return false

    // 3. 참여 가능한 상태 (null, WITHDRAWN, WITHDRAW)
    const s = userStatus.value
    return s === null || s === 'WITHDRAWN' || s === 'WITHDRAW'
})

const canWithdraw = computed(() => {
    // 1. 캠페인 데이터가 없거나 관리자면 미노출
    if (!campaign.value || authStore.isAdmin) return false

    // 2. 탈퇴 가능 기간 체크 (진행 중일 때만 가능)
    const now = new Date()
    const startDate = new Date(campaign.value.startDate)
    const endDate = new Date(campaign.value.endDate)
    const isRunning = now >= startDate && now <= endDate

    if (!isRunning) return false

    // 3. 현재 참여 중인 상태 (ACTIVE)
    return userStatus.value === 'ACTIVE'
})

// --- Admin Search & Add ---
const handleSearch = async () => {
    if (!searchKeyword.value) return
    try {
        const res = await searchProblems({
            'platform-type': searchPlatform.value,
            keyword: searchKeyword.value
        })
        if (res.data && res.data.searchedProblems) {
            searchResults.value = res.data.searchedProblems
        } else {
            searchResults.value = []
        }
    } catch (e) {
        alertStore.showAlert('ERROR', 'SEARCH FAILED')
    }
}

// --- Join & Withdraw ---
const handleJoin = async () => {
    const result = await alertStore.showConfirm('JOIN CAMPAIGN', 'DO YOU WISH TO PARTICIPATE IN THIS MISSION?')
    if (!result) return
    try {
        await joinCampaign(campaignId)
        await alertStore.showAlert('SUCCESS', 'WELCOME TO THE CAMPAIGN')
        fetchData()
    } catch (e) {
        console.error(e)
        const msg = e.response?.data?.message || 'FAILED TO JOIN'
        alertStore.showAlert('ERROR', msg)
    }
}

const handleWithdraw = async () => {
    const result = await alertStore.showConfirm('WITHDRAWAL', 'WARNING: WITHDRAW FROM CAMPAIGN?')
    if (!result) return
    try {
        await withdrawCampaign(campaignId)
        await alertStore.showAlert('SUCCESS', 'WITHDRAWAL COMPLETE')
        fetchData()
    } catch (e) {
        console.error(e)
        alertStore.showAlert('ERROR', 'FAILED TO WITHDRAW')
    }
}

const toggleSelectProblem = (problem) => {
    const targetId = problem.id
    const idx = newProblems.value.findIndex(p => p.id === targetId)

    if (idx >= 0) {
        newProblems.value.splice(idx, 1)
        delete newProblemDates.value[targetId]
    } else {
        newProblems.value.push(problem)
        // Default to datetime-local format: YYYY-MM-DDTHH:mm
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const toLocalISO = (d) => {
            const pad = (n) => n.toString().padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }

        newProblemDates.value[targetId] = {
            startDate: toLocalISO(now),
            endDate: toLocalISO(tomorrow)
        }
    }
}

const isSelected = (id) => newProblems.value.some(p => p.id === id)

const submitAddProblems = async () => {
    if (newProblems.value.length === 0) return

    for (const p of newProblems.value) {
        const dates = newProblemDates.value[p.id]
        if (!dates?.startDate || !dates?.endDate) {
            alertStore.showAlert('DATE REQUIRED', `Set dates for: ${p.title}`)
            return
        }
    }

    const payload = {
        problems: newProblems.value.map(p => ({
            problemId: p.id,
            startDate: newProblemDates.value[p.id].startDate, // Ensure seconds are added if backend needs standard ISO
            endDate: newProblemDates.value[p.id].endDate
        }))
    }

    try {
        await addCampaignProblems(campaignId, payload)
        await alertStore.showAlert('SUCCESS', 'ADDED SUCCESSFULLY')
        showAddModal.value = false
        newProblems.value = []
        newProblemDates.value = {}
        searchResults.value = []
        fetchData()
    } catch (e) {
        alertStore.showAlert('ERROR', 'FAILED TO ADD')
    }
}

// --- Detail & Delete ---
const openDetailModal = (problem) => {
    selectedDetailProblem.value = problem
    showDetailModal.value = true
}

const handleDeleteProblem = async (problem = null) => {
    // Check if problem is a valid object (not an Event) to avoid overwriting state with MouseEvent
    if (problem && problem.campaignProblemId) {
        selectedDetailProblem.value = problem
    }
    if (!selectedDetailProblem.value) return
    const result = await alertStore.showConfirm('DELETE', 'WARNING: DELETE THIS STAGE?')
    if (!result) return

    console.log('Attempting to delete:', selectedDetailProblem.value)
    // Try to find the correct ID field. The API likely needs the mapping ID or the problem ID depending on backend implementation.
    // Based on typical ManyToMany, it might be an ID specific to the relation.
    // Falling back to `id` (often the relation ID) or `problemId` (the actual problem).
    const targetId = selectedDetailProblem.value.campaignProblemId

    if (!targetId) {
        alertStore.showAlert('ERROR', 'Undefined Problem ID')
        return
    }

    try {
        await deleteCampaignProblem(campaignId, targetId)
        await alertStore.showAlert('SUCCESS', 'STAGE DELETED')
        showDetailModal.value = false
        selectedDetailProblem.value = null
        fetchData()
    } catch (e) {
        console.error(e)
        alertStore.showAlert('ERROR', 'DELETE FAILED')
    }
}

const goToSubmission = (item) => {
    // 1. 관리자는 프리패스, 사용자는 ACTIVE 상태여야 함
    const isActive = userStatus.value === 'ACTIVE'

    if (!authStore.isAdmin && !isActive) {
        alertStore.showAlert('ACCESS DENIED', 'JOIN CAMPAIGN FIRST')
        return
    }

    // 2. 기간 체크
    const status = getProblemStatus(item.startDate, item.endDate)
    if (status !== 'CURRENT' && !authStore.isAdmin) {
        alertStore.showAlert('ACCESS DENIED', `PROBLEM IS ${status}`)
        return
    }

    router.push(`/campaigns/${campaignId}/problems/${item.campaignProblemId}/submit`)
}


const getDifficultyColor = (diff) => {
    // ... same as before
    if (!diff) return 'text-gray-500'
    if (diff.includes('BRONZE')) return 'text-orange-700'
    if (diff.includes('SILVER')) return 'text-gray-400'
    if (diff.includes('GOLD')) return 'text-yellow-500'
    if (diff.includes('PLATINUM')) return 'text-cyan-400'
    if (diff.includes('DIAMOND')) return 'text-blue-500'
    if (diff.includes('RUBY')) return 'text-red-500'
    return 'text-gray-500'
}

onMounted(() => {
    fetchData()

    // Setup Intersection Observer for scroll animations
    observer.value = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible')
                observer.value.unobserve(entry.target) // Stop observing once visible
            }
        })
    }, { threshold: 0.1 })
})

// watch for problems to change, then observe new elements
watch(problems, async () => {
    await nextTick()
    if (problemElements.value && observer.value) {
        problemElements.value.forEach(el => {
            if (el) observer.value.observe(el)
        })
    }
})
</script>

<template>
    <div
        class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative overflow-hidden selection:bg-green-500/30">
        <!-- Background -->
        <div class="absolute inset-0 z-0">
            <img src="@/assets/pixel_city_bg.png" class="w-full h-full object-cover opacity-60 fixed"
                alt="Cyberpunk City" />
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm fixed"></div>
        </div>

        <CommonHeader />

        <!-- Loading State -->
        <div v-if="isLoading" class="relative z-10 flex-1 flex items-center justify-center">
            <div class="text-green-500 animate-pulse text-xl font-bold">
                <PixelText>> DOWNLOADING_SECTOR_MAP..._</PixelText>
            </div>
        </div>

        <!-- Content -->
        <div v-else
            class="relative z-10 flex-1 max-w-[1200px] mx-auto w-full p-4 md:p-8 flex flex-col gap-12 overflow-y-auto">

            <!-- Hero Dashboard -->
            <section class="w-full bg-[#1e1e1e]/80 border-2 border-green-500/30 p-6 md:p-8 pixel-window relative group">
                <!-- Retro Decorations -->
                <div class="absolute -top-1 -left-1 w-3 h-3 bg-green-500"></div>
                <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500"></div>
                <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500"></div>
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500"></div>

                <div
                    class="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center border-b border-gray-700 pb-6 mb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <div
                                class="px-2 py-0.5 bg-green-900/50 border border-green-500 text-green-400 text-[10px] tracking-widest">
                                <PixelText>SECTOR {{ campaign.id.toString().padStart(3, '0') }}</PixelText>
                            </div>
                            <span class="text-gray-500 text-xs">// {{ formatDate(campaign.startDate) }} ~ {{
                                formatDate(campaign.endDate) }}</span>
                        </div>
                        <h1 class="text-2xl md:text-4xl text-white leading-tight">
                            <PixelText variant="title">{{ campaign.title }}</PixelText>
                        </h1>
                    </div>

                    <!-- Stats Grid -->
                    <div class="flex flex-col gap-4 text-right">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-gray-500">CAPACITY</span>
                                <span class="text-xl text-green-400 font-bold font-sans">{{ campaign.capacity }}
                                    UNITS</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-gray-500">STATUS</span>
                                <span class="text-xl text-green-400 font-bold font-sans">ACTIVE</span>
                            </div>
                        </div>

                        <!-- Admin Action -->
                        <div class="mt-2 flex justify-end gap-2" v-if="!authStore.isAdmin"> <!-- Admin Add -->
                            <button v-if="authStore.isAdmin" @click="showAddModal = true"
                                class="px-4 py-2 border-2 border-purple-500 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white transition-all text-xs font-bold">
                                <PixelText>[ + ADMIN: ADD STAGE ]</PixelText>
                            </button>

                            <!-- User Join/Withdraw -->
                            <template v-if="campaign">
                                <button v-if="canWithdraw" @click="handleWithdraw"
                                    class="px-4 py-2 border-2 border-red-500 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all text-xs font-bold">
                                    <PixelText>[ WITHDRAW ]</PixelText>
                                </button>

                                <button v-else-if="canJoin" @click="handleJoin"
                                    class="px-4 py-2 border-2 border-green-500 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white transition-all text-xs font-bold animate-pulse">
                                    <PixelText> >> JOIN MISSION &lt;&lt;</PixelText>
                                </button>

                            </template>
                        </div>
                    </div>
                </div>

                <p class="text-gray-400 font-sans leading-relaxed md:w-3/4">
                    {{ campaign.description }}
                </p>
            </section>

            <!-- Timeline / Stage Map -->
            <section class="relative pl-8 md:pl-0">
                <!-- Connecting Line (Vertical) -->
                <div
                    class="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500/50 via-green-500/20 to-transparent -translate-x-1/2 z-0 hidden md:block">
                </div>
                <div
                    class="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500/50 via-green-500/20 to-transparent z-0 md:hidden">
                </div>

                <div v-if="timelineItems.length === 0" class="text-center py-20 opacity-50">
                    <PixelText>> NO STAGES DATA AVAILABLE...</PixelText>
                </div>

                <div class="flex flex-col gap-0">
                    <template v-for="(item, idx) in timelineItems" :key="idx">

                        <!-- PROBLEM CARD (Stage) -->
                        <div v-if="item.type === 'problem'" ref="problemElements"
                            class="relative flex items-center mb-8 md:mb-12 min-h-[150px] fade-in-section" :class="[
                                idx % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row',
                                getProblemStatus(item.data.startDate, item.data.endDate) === 'FUTURE' && !authStore.isAdmin && !campaign?.isParticipated ? 'foggy-future' : '',
                                item.isLocked ? 'foggy-locked' : ''
                            ]">

                            <!-- Timeline Dot -->
                            <div class="absolute left-0 md:left-1/2 -translate-x-[5px] md:-translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-2 z-20 rounded-full transition-colors"
                                :class="isProblemEnded(item.data.endDate) ? 'border-purple-500 bg-purple-500 shadow-[0_0_10px_purple]' : 'border-green-500 group-hover:bg-green-500'">
                            </div>

                            <!-- Spacer OR Review Box -->
                            <div class="hidden md:flex w-1/2 px-12 items-center"
                                :class="idx % 2 === 0 ? 'justify-start' : 'justify-end'">
                                <!-- REVIEW BOX (Only if Ended AND Submitted) -->
                                <div v-if="isProblemEnded(item.data.endDate) && item.data.submitted"
                                    @click="goToReview(item.data)"
                                    class="relative p-4 border border-purple-500/30 bg-purple-900/10 backdrop-blur-sm w-full max-w-sm group cursor-pointer hover:border-purple-500 transition-all hover:bg-purple-900/20 shadow-[0_0_0_rgba(168,85,247,0)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                    <h4 class="text-purple-300 font-bold mb-1 text-sm group-hover:text-purple-200">
                                        <PixelText>> START REVIEW</PixelText>
                                    </h4>
                                    <p class="text-[10px] text-purple-200/50 group-hover:text-purple-200/80">
                                        Matching complete. View assignments and start code review.
                                    </p>

                                    <!-- Review Decoration -->
                                    <div
                                        class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 group-hover:animate-ping">
                                    </div>
                                    <div
                                        class="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-500 group-hover:animate-ping">
                                    </div>
                                </div>
                            </div>

                            <!-- Problem Card Content -->
                            <div class="w-full md:w-1/2 pl-8 md:pl-12 md:pr-12"
                                :class="idx % 2 === 0 ? 'md:pl-0 md:pr-12 md:text-right' : 'md:pl-12 md:text-left'">
                                <div class="bg-black/40 border border-gray-700 hover:border-green-400 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(74,222,128,0.1)] group cursor-pointer relative overflow-hidden"
                                    @click="goToSubmission(item.data)">

                                    <div class="absolute top-0 bottom-0 w-1 bg-green-500/50 transition-all duration-300 group-hover:h-full h-0"
                                        :class="idx % 2 === 0 ? 'right-0' : 'left-0'"></div>

                                    <!-- STATUS BAR (Admin Edit & Submitted Badge) -->
                                    <div class="absolute top-2 z-30 flex gap-2 items-center"
                                        :class="idx % 2 === 0 ? 'left-2 flex-row' : 'right-2 flex-row-reverse'">

                                        <!-- ADMIN: DELETE -->
                                        <button v-if="authStore.isAdmin" @click.stop="handleDeleteProblem(item.data)"
                                            class="text-[10px] uppercase font-bold text-red-500 hover:text-white bg-black/80 hover:bg-red-600 px-2 py-1 border border-red-500/30 transition-colors">
                                            [ DELETE ]
                                        </button>

                                        <!-- USER: SUBMITTED BADGE -->
                                        <div v-if="item.data.submitted"
                                            class="text-[10px] uppercase font-bold text-black bg-green-500 px-2 py-1 border border-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                                            [ SUBMITTED ]
                                        </div>
                                        <div v-if="!item.data.submitted"
                                            class="text-[10px] uppercase font-bold text-black bg-red-500 px-2 py-1 border border-red-400 shadow-[0_0_5px_rgba(222,74,74,0.5)]">
                                            [ NOT SUBMITTED ]
                                        </div>
                                    </div>

                                    <div class="flex flex-col gap-1 pt-4">
                                        <div class="flex items-center gap-2 mb-1"
                                            :class="idx % 2 === 0 ? 'md:justify-end' : 'md:justify-start'">
                                            <span class="text-green-500 text-[10px] tracking-widest font-bold">
                                                <PixelText>DAY {{ item.index.toString().padStart(2, '0') }}
                                                </PixelText>
                                            </span>
                                            <span v-if="item.data.problem"
                                                class="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5"
                                                style="border-radius: 2px;">
                                                {{ item.data.problem.platformType }}
                                            </span>
                                            <span v-if="item.data.problem" class="text-[10px] font-bold"
                                                :class="getDifficultyColor(item.data.problem.difficultyType)">
                                                {{ item.data.problem.difficultyType }}
                                            </span>
                                        </div>

                                        <h3 class="text-white text-lg font-bold truncate tracking-wide font-sans mb-2">
                                            {{ item.data.title || (item.data.problem ? item.data.problem.title :
                                                'Loading...') }}</h3>

                                        <!-- Stats Grid (Refined) -->
                                        <div
                                            class="grid grid-cols-3 gap-0 mt-3 border-t border-b border-gray-800 bg-white/5">
                                            <div
                                                class="flex flex-col items-center py-2 border-r border-gray-800/50 last:border-0">
                                                <span
                                                    class="text-[8px] text-gray-400 tracking-wider mb-1">PARTICIPANTS</span>
                                                <span class="text-sm font-bold text-white font-mono">{{
                                                    item.data.participantCount || 0 }}</span>
                                            </div>
                                            <div
                                                class="flex flex-col items-center py-2 border-r border-gray-800/50 last:border-0">
                                                <span class="text-[8px] text-gray-400 tracking-wider mb-1">SUBMIT</span>
                                                <span class="text-sm font-bold text-white font-mono">{{
                                                    item.data.submissionCount || 0 }}</span>
                                            </div>
                                            <div
                                                class="flex flex-col items-center py-2 border-r border-gray-800/50 last:border-0">
                                                <span class="text-[8px] text-gray-400 tracking-wider mb-1">SOLVED</span>
                                                <span class="text-sm font-bold text-green-400 font-mono">{{
                                                    item.data.solvedCount || 0 }}</span>
                                            </div>

                                        </div>

                                        <div class="flex gap-2 text-[12px] text-gray-500 font-mono mt-3"
                                            :class="idx % 2 === 0 ? 'md:justify-end' : 'md:justify-start'">
                                            <span>{{ formatDateTime(item.data.startDate) }}</span>
                                            <span> ~ </span>
                                            <span>{{ formatDateTime(item.data.endDate) }}</span>
                                        </div>

                                        <!-- Status Indicator -->
                                        <div v-if="getProblemStatus(item.data.startDate, item.data.endDate) === 'CURRENT'"
                                            class="mt-1 text-green-400 text-[10px] animate-pulse font-bold">
                                            >> CURRENTLY ACTIVE
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- GAP (Connector) -->
                        <div v-else class="relative flex justify-center mb-8 md:mb-16">
                            <div
                                class="absolute left-0 md:left-1/2 -translate-x-[3px] md:-translate-x-1/2 w-1.5 h-1.5 bg-yellow-500/50 rounded-full z-10">
                            </div>
                            <div
                                class="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-sm backdrop-blur-sm ml-8 md:ml-0">
                                <span class="text-[10px] text-yellow-200 uppercase tracking-wider font-mono">
                                    Rest: {{ item.duration }} Days
                                </span>
                            </div>
                        </div>

                    </template>

                    <!-- End Node -->
                    <div class="flex justify-center mt-8 relative">
                        <div
                            class="absolute left-0 md:left-1/2 -translate-x-[7px] md:-translate-x-1/2 w-4 h-4 bg-[#0a0a0a] border-4 border-green-600 z-10 rounded-full">
                        </div>
                        <div class="mt-8 text-center ml-8 md:ml-0">
                            <span class="text-gray-600 text-xs tracking-[0.5em] uppercase">End of Line</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- ADMIN ADD MODAL -->
        <div v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div
                class="bg-[#1e1e1e] border-2 border-purple-500 w-full max-w-6xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                <!-- Header -->
                <div class="p-4 border-b border-gray-700 bg-purple-900/20 flex justify-between items-center shrink-0">
                    <div class="flex items-center gap-4">
                        <PixelText class="text-purple-400 text-lg">> ADD SEQUENCE // PROBLEMS</PixelText>
                        <span class="text-xs text-gray-500">Add problems to this campaign sector.</span>
                    </div>
                    <button @click="showAddModal = false" class="text-gray-500 hover:text-white px-2">X</button>
                </div>

                <!-- Body -->
                <div class="flex-1 flex overflow-hidden">
                    <!-- Search Side -->
                    <div class="w-3/5 border-r border-gray-700 p-6 flex flex-col gap-6">
                        <div class="flex gap-2 shrink-0">
                            <select v-model="searchPlatform"
                                class="bg-black border border-gray-600 text-white text-sm p-3 outline-none focus:border-purple-500 w-40">
                                <option value="BOJ">BOJ</option>
                                <option value="PROGRAMMERS">PROGRAMMERS</option>
                                <option value="SWEA">SWEA</option>
                            </select>
                            <input v-model="searchKeyword" @keyup.enter="handleSearch" type="text"
                                placeholder="Search Title or ID..."
                                class="flex-1 bg-black border border-gray-600 text-white text-sm p-3 outline-none focus:border-purple-500" />
                            <button @click="handleSearch"
                                class="bg-purple-600 text-white px-6 py-1 font-bold text-sm hover:bg-purple-500 uppercase tracking-widest">Find</button>
                        </div>

                        <!-- Results List -->
                        <div class="flex-1 overflow-y-auto border border-gray-800 bg-black/50 p-2 custom-scrollbar">
                            <div v-for="res in searchResults" :key="res.id"
                                class="p-3 mb-2 border hover:bg-purple-900/30 flex justify-between items-start transition-colors group"
                                :class="isSelected(res.id) ? 'border-purple-500 bg-purple-900/20' : 'border-gray-800 bg-[#151515]'"
                                @click="toggleSelectProblem(res)">

                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span
                                            class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                                            {{ res.platformType }}
                                        </span>
                                        <span class="text-[10px] font-mono text-gray-500">#{{ res.problemNo }}</span>
                                        <span class="text-[10px] font-bold"
                                            :class="getDifficultyColor(res.difficultyType)">
                                            {{ res.difficultyType }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <!-- Title Link -->
                                        <a :href="res.problemLink" target="_blank" @click.stop
                                            class="text-white font-bold hover:text-purple-400 hover:underline decoration-1 underline-offset-4 truncate max-w-[400px] block">
                                            {{ res.title }}
                                        </a>
                                        <span
                                            class="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            [LINK]
                                        </span>
                                    </div>
                                </div>

                                <!-- Checkbox UI -->
                                <div
                                    class="w-6 h-6 border border-gray-600 flex items-center justify-center bg-black ml-4 shrink-0">
                                    <div v-if="isSelected(res.id)" class="w-4 h-4 bg-purple-500"></div>
                                </div>
                            </div>

                            <div v-if="searchResults.length === 0"
                                class="flex flex-col items-center justify-center h-40 text-gray-700">
                                <span class="text-4xl mb-2 opacity-20">?</span>
                                <span class="text-sm">Initiate Search Protocol...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Selection & Dates Side -->
                    <div class="w-2/5 p-6 flex flex-col gap-4 bg-[#0c0c0c] shrink-0">
                        <div class="flex justify-between items-end border-b border-gray-800 pb-2">
                            <h3 class="text-sm text-gray-500 uppercase tracking-widest">Upload Queue</h3>
                            <span class="text-xs text-purple-500">{{ newProblems.length }} Items</span>
                        </div>

                        <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                            <div v-for="p in newProblems" :key="p.id"
                                class="bg-[#1e1e1e] border-l-4 border-purple-500 p-4 relative group hover:bg-[#252525] transition-colors">
                                <button @click.stop="toggleSelectProblem(p)"
                                    class="absolute top-2 right-2 text-red-900 group-hover:text-red-500 text-xs font-bold px-2 py-1 bg-black/50 hover:bg-black transition-colors rounded">del</button>

                                <div class="mb-3 pr-8">
                                    <div class="text-[10px] text-gray-500 mb-0.5">{{ p.platformType }} #{{ p.problemNo
                                        }}</div>
                                    <h4 class="text-sm text-white font-bold truncate">{{ p.title }}</h4>
                                </div>

                                <div class="grid grid-cols-1 gap-3">
                                    <div>
                                        <label class="block text-[9px] text-purple-400 mb-1 font-bold">START
                                            TIME</label>
                                        <input type="datetime-local" step="1" v-model="newProblemDates[p.id].startDate"
                                            class="w-full bg-black border border-gray-700 text-white text-xs p-2 focus:border-purple-500 outline-none rounded-sm" />
                                    </div>
                                    <div>
                                        <label class="block text-[9px] text-purple-400 mb-1 font-bold">END TIME</label>
                                        <input type="datetime-local" step="1" v-model="newProblemDates[p.id].endDate"
                                            class="w-full bg-black border border-gray-700 text-white text-xs p-2 focus:border-purple-500 outline-none rounded-sm" />
                                    </div>
                                </div>
                            </div>
                            <div v-if="newProblems.length === 0"
                                class="text-gray-800 text-center mt-20 flex flex-col items-center">
                                <span class="text-xs italic">Queue Empty</span>
                                <span class="text-[10px] text-gray-800 mt-2">Select problems from the left to
                                    configure.</span>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-gray-800">
                            <button @click="submitAddProblems" :disabled="newProblems.length === 0"
                                class="w-full py-4 bg-purple-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold tracking-[0.2em] hover:bg-purple-500 transition-all text-sm uppercase shadow-lg shadow-purple-900/20">
                                Execute Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- PROBLEM DETAIL MODAL -->
        <div v-if="showDetailModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            @click.self="showDetailModal = false">
            <div
                class="bg-[#1e1e1e] border-2 border-green-500 w-full max-w-lg shadow-[0_0_50px_rgba(74,222,128,0.2)] p-6 relative">
                <button @click="showDetailModal = false"
                    class="absolute top-4 right-4 text-gray-500 hover:text-white">X</button>

                <h2 class="text-xl text-green-400 font-bold mb-4">
                    <PixelText>> STAGE INFO</PixelText>
                </h2>

                <div class="space-y-4 font-mono" v-if="selectedDetailProblem">
                    <div class="p-4 border border-gray-700 bg-black/50">
                        <span class="text-[10px] text-gray-500 block mb-1">IDENTIFIER</span>
                        <h3 class="text-lg text-white font-bold">{{ selectedDetailProblem.title }}</h3>
                        <p class="text-xs text-gray-400 mt-1">{{ selectedDetailProblem.platformType }} #{{
                            selectedDetailProblem.problemNo }}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-3 border border-gray-700 bg-black/30">
                            <span class="text-[10px] text-gray-500 block mb-1">START</span>
                            <span class="text-xs text-white">{{ formatDateTime(selectedDetailProblem.startDate)
                            }}</span>
                        </div>
                        <div class="p-3 border border-gray-700 bg-black/30">
                            <span class="text-[10px] text-gray-500 block mb-1">DEADLINE</span>
                            <span class="text-xs text-white">{{ formatDateTime(selectedDetailProblem.endDate) }}</span>
                        </div>
                    </div>

                    <a :href="selectedDetailProblem.problemLink" target="_blank"
                        class="block w-full py-3 text-center border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-colors font-bold text-xs tracking-widest">
                        ACCESS TERMINAL [LINK]
                    </a>

                    <button v-if="authStore.isAdmin" @click="() => handleDeleteProblem()"
                        class="block w-full py-3 mt-4 text-center border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-bold text-xs tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        // ADMIN OVERRIDE: DELETE
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.pixel-window {
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
}

/* Scroll Animation Classes */
.fade-in-section {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    will-change: opacity, visibility;
}

.fade-in-section.is-visible {
    opacity: 1;
    transform: none;
}

/* Future Problem Foggy Effect */
.foggy-future {
    filter: blur(5px) grayscale(0.8);
    opacity: 0.6;
    pointer-events: none;
    user-select: none;
    transition: all 0.5s;
}

/* Locked Foggy Effect for Non-Participants */
.foggy-locked {
    filter: blur(10px) grayscale(100%);
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
    cursor: not-allowed;
}
</style>
