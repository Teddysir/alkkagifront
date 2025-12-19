```vue
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCampaignDetail, getCampaignProblems, searchProblems, addCampaignProblems, deleteCampaignProblem } from '@/api/campaign'
import { useAuthStore } from '@/api/stores'
import CommonHeader from '@/components/CommonHeader.vue'
import PixelText from '@/components/PixelText.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const campaignId = route.params.id

const isLoading = ref(true)
const campaign = ref(null)
const problems = ref([])

// Admin Modal State
const showAddModal = ref(false)
const searchPlatform = ref('BOJ')
const searchKeyword = ref('')
const searchResults = ref([])
const newProblems = ref([])
const newProblemDates = ref({})

// Detail Modal State
const showDetailModal = ref(false)
const selectedDetailProblem = ref(null)

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return '????. ??. ??'
    const date = new Date(dateString)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}. ${m}. ${d}`
}

const formatDateTime = (dateString) => {
    if (!dateString) return '????. ??. ?? ??:??'
    const date = new Date(dateString)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}. ${m}. ${d} ${h}:${min}`
}

const isProblemEnded = (endDate) => {
    return new Date() > new Date(endDate)
}

// Timeline Items
const timelineItems = computed(() => {
    const items = []
    if (!problems.value.length) return items

    const sorted = [...problems.value].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

    for (let i = 0; i < sorted.length; i++) {
        items.push({ type: 'problem', data: sorted[i], index: i + 1 })

        if (i < sorted.length - 1) {
            const currentEnd = new Date(sorted[i].endDate)
            const nextStart = new Date(sorted[i + 1].startDate)
            if (nextStart > currentEnd) {
                items.push({
                    type: 'review_gap', // Renamed to distinguish from the "Review Box" feature 
                    startDate: sorted[i].endDate,
                    endDate: sorted[i + 1].startDate,
                    duration: Math.ceil((nextStart - currentEnd) / (1000 * 60 * 60 * 24))
                })
            }
        }
    }
    return items
})

const fetchData = async () => {
    try {
        isLoading.value = true
        const [detailRes, problemsRes] = await Promise.all([
            getCampaignDetail(campaignId),
            getCampaignProblems(campaignId, { limit: 100 })
        ])

        campaign.value = detailRes.data
        if (problemsRes.data) {
            if (Array.isArray(problemsRes.data)) {
                problems.value = problemsRes.data
            } else if (problemsRes.data.content) {
                problems.value = problemsRes.data.content
            } else {
                console.warn('Unknown problem list format', problemsRes.data)
                problems.value = []
            }
        }
    } catch (error) {
        console.error('Failed to load detail:', error)
        router.push('/campaigns')
    } finally {
        isLoading.value = false
    }
}

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
        alert('SEARCH FAILED')
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
            alert(`Set dates for: ${p.title}`)
            return
        }
    }

    const payload = {
        problems: newProblems.value.map(p => ({
            problemId: p.id,
            startDate: newProblemDates.value[p.id].startDate + ':00', // Ensure seconds are added if backend needs standard ISO
            endDate: newProblemDates.value[p.id].endDate + ':59'
        }))
    }

    try {
        await addCampaignProblems(campaignId, payload)
        alert('ADDED SUCCESSFULLY')
        showAddModal.value = false
        newProblems.value = []
        newProblemDates.value = {}
        searchResults.value = []
        fetchData()
    } catch (e) {
        alert('FAILED TO ADD')
    }
}

// --- Detail & Delete ---
const openDetailModal = (problem) => {
    selectedDetailProblem.value = problem
    showDetailModal.value = true
}

const handleDeleteProblem = async () => {
    if (!selectedDetailProblem.value) return
    if (!confirm('WARNING: DELETE THIS STAGE?')) return

    try {
        await deleteCampaignProblem(campaignId, selectedDetailProblem.value.problemId || selectedDetailProblem.value.id)
        alert('STAGE DELETED')
        showDetailModal.value = false
        selectedDetailProblem.value = null
        fetchData()
    } catch (e) {
        console.error(e)
        alert('DELETE FAILED')
    }
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

onMounted(fetchData)
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
                        <div v-if="authStore.isAdmin" class="mt-2">
                            <button @click="showAddModal = true"
                                class="px-4 py-2 border-2 border-purple-500 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white transition-all text-xs font-bold">
                                <PixelText>[ + ADMIN: ADD STAGE ]</PixelText>
                            </button>
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
                        <div v-if="item.type === 'problem'"
                            class="relative flex items-center mb-12 md:mb-20 min-h-[150px]"
                            :class="idx % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'">

                            <!-- Timeline Dot -->
                            <div class="absolute left-0 md:left-1/2 -translate-x-[5px] md:-translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-2 z-20 rounded-full transition-colors"
                                :class="isProblemEnded(item.data.endDate) ? 'border-purple-500 bg-purple-500 shadow-[0_0_10px_purple]' : 'border-green-500 group-hover:bg-green-500'">
                            </div>

                            <!-- Spacer OR Review Box -->
                            <div class="hidden md:flex w-1/2 px-12 items-center"
                                :class="idx % 2 === 0 ? 'justify-start' : 'justify-end'">
                                <!-- REVIEW BOX (Only if Ended) -->
                                <div v-if="isProblemEnded(item.data.endDate)"
                                    class="relative p-4 border border-purple-500/30 bg-purple-900/10 backdrop-blur-sm w-full max-w-sm group cursor-pointer hover:border-purple-500 transition-all">
                                    <h4 class="text-purple-300 font-bold mb-1 text-sm">
                                        <PixelText>STAGE REVIEW</PixelText>
                                    </h4>
                                    <p class="text-[10px] text-purple-200/50">Analysis complete. Access archived data?
                                    </p>

                                    <!-- Review Decoration -->
                                    <div class="absolute -top-1 -right-1 w-2 h-2 bg-purple-500"></div>
                                    <div class="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-500"></div>
                                </div>
                            </div>

                            <!-- Problem Card Content -->
                            <div class="w-full md:w-1/2 pl-8 md:pl-12 md:pr-12"
                                :class="idx % 2 === 0 ? 'md:pl-0 md:pr-12 md:text-right' : 'md:pl-12 md:text-left'">
                                <div class="bg-black/40 border border-gray-700 hover:border-green-400 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(74,222,128,0.1)] group cursor-pointer relative overflow-hidden"
                                    @click="openDetailModal(item.data)">

                                    <div class="absolute top-0 bottom-0 w-1 bg-green-500/50 transition-all duration-300 group-hover:h-full h-0"
                                        :class="idx % 2 === 0 ? 'right-0' : 'left-0'"></div>

                                    <div class="flex flex-col gap-1">
                                        <span class="text-green-500 text-[10px] tracking-widest font-bold mb-1">
                                            <PixelText>STAGE {{ item.index.toString().padStart(2, '0') }}</PixelText>
                                        </span>
                                        <h3 class="text-white text-lg font-bold truncate">{{ item.data.title }}</h3>
                                        <div class="flex gap-2 text-xs text-gray-500 font-mono mt-2"
                                            :class="idx % 2 === 0 ? 'md:justify-end' : 'md:justify-start'">
                                            <span>{{ formatDateTime(item.data.startDate) }}</span>
                                            <span>~</span>
                                            <span>{{ formatDateTime(item.data.endDate) }}</span>
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

                                <div class="grid grid-cols-2 gap-3">
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

                    <button v-if="authStore.isAdmin" @click="handleDeleteProblem"
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
</style>
```
