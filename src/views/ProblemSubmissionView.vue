<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProblemDetail } from '@/api/problem'
import { searchAlgorithms, submitCode } from '@/api/submission'
import CommonHeader from '@/components/CommonHeader.vue'
import PixelText from '@/components/PixelText.vue'
import PixelButton from '@/components/PixelButton.vue'
import PixelInput from '@/components/PixelInput.vue'

const route = useRoute()
const router = useRouter()
const { campaignId, problemId } = route.params

const isLoading = ref(true)
const problem = ref({})

// Submission Form Data
const language = ref('JAVA') // Default
const code = ref(`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`)
const strategy = ref('')
const execTime = ref(0)
const memory = ref(0)
const isSuccess = ref(true)

// Algorithm Search
const algoKeyword = ref('')
const algoSearchResults = ref([])
const selectedAlgorithms = ref([])

// Fetch Problem Detail
const fetchDetail = async () => {
    try {
        isLoading.value = true
        const res = await getProblemDetail(problemId)
        problem.value = res.data
    } catch (e) {
        console.error(e)
        alert('Failed to load problem details')
    } finally {
        isLoading.value = false
    }
}

// Algorithm Logic
const handleAlgoSearch = async () => {
    if (!algoKeyword.value) return
    try {
        const res = await searchAlgorithms(algoKeyword.value)
        algoSearchResults.value = res.data.algorithmList
    } catch (e) {
        console.error(e)
    }
}

const addAlgorithm = (algo) => {
    if (!selectedAlgorithms.value.find(a => a.id === algo.id)) {
        selectedAlgorithms.value.push(algo)
    }
    algoSearchResults.value = [] // Clear search
    algoKeyword.value = ''
}

const removeAlgorithm = (index) => {
    selectedAlgorithms.value.splice(index, 1)
}

// Submit Logic
const handleSubmit = async () => {
    if (!code.value || !strategy.value) {
        alert('Please fill in all fields (Code & Strategy).')
        return
    }

    const payload = {
        language: language.value,
        code: code.value,
        strategy: strategy.value,
        execTime: Number(execTime.value),
        memory: Number(memory.value),
        isSuccess: isSuccess.value,
        algorithmList: selectedAlgorithms.value.map(a => a.name)
    }

    try {
        await submitCode(problemId, payload)
        alert('SUBMISSION COMPLETE!')
        router.push(`/campaigns/${campaignId}`)
    } catch (e) {
        console.error(e)
        alert('Submission Failed')
    }
}

const languages = ['JAVA', 'C++', 'PYTHON', 'JAVASCRIPT']

onMounted(() => {
    fetchDetail()
})
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative selection:bg-green-500/30">
        <!-- Background -->
        <div class="absolute inset-0 z-0">
            <img src="@/assets/pixel_city_bg.png" class="w-full h-full object-cover opacity-60 fixed"
                alt="Cyberpunk City" />
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm fixed"></div>
        </div>

        <CommonHeader />

        <div
            class="relative z-10 flex-1 max-w-[1400px] mx-auto w-full p-6 flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)] overflow-hidden">

            <!-- LEFT: Problem Info & Code Editor -->
            <div class="flex-1 flex flex-col gap-4 h-full overflow-hidden">
                <!-- Problem Info Card -->
                <div class="bg-[#1e1e1e]/90 border border-gray-700 p-4 shrink-0">
                    <div class="flex justify-between items-start mb-2">
                        <h2 class="text-xl text-white font-bold">
                            <PixelText>{{ problem.title || 'Loading...' }}</PixelText>
                        </h2>
                        <a :href="problem.problemLink" target="_blank" class="text-xs text-blue-400 hover:underline">[
                            OPEN LINK ]</a>
                    </div>
                    <div class="flex gap-4 text-xs text-gray-400">
                        <span>NO: {{ problem.problem_no }}</span>
                        <span>PLATFORM: {{ problem.platform }}</span>
                        <span
                            :class="{ 'text-green-400': problem.difficulty === 'EASY', 'text-red-400': problem.difficulty === 'HARD' }">
                            LV: {{ problem.difficulty }}
                        </span>
                    </div>
                </div>

                <!-- Code Editor Area -->
                <div class="flex-1 bg-black/80 border border-gray-700 flex flex-col overflow-hidden">
                    <div class="bg-[#2d2d2d] p-2 flex justify-between items-center border-b border-gray-700">
                        <span class="text-xs text-gray-400 font-bold">SOURCE CODE</span>
                        <select v-model="language"
                            class="bg-black text-white text-xs p-1 border border-gray-600 focus:border-green-500 outline-none">
                            <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
                        </select>
                    </div>
                    <textarea v-model="code"
                        class="flex-1 w-full bg-[#1a1a1a] text-gray-300 p-4 font-mono text-sm resize-none outline-none focus:bg-[#1a1a1a]"
                        spellcheck="false" placeholder="// Type your code here..."></textarea>
                </div>
            </div>

            <!-- RIGHT: Submission Stats & Algo -->
            <div class="w-full md:w-[400px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-10 md:pb-0">

                <!-- Algorithm Selector -->
                <div class="bg-[#1e1e1e]/90 border border-gray-700 p-4 flex flex-col gap-3">
                    <label class="text-xs text-gray-400 font-bold">ALGORITHM TAGS</label>
                    <div class="relative">
                        <div class="flex gap-2">
                            <PixelInput v-model="algoKeyword" placeholder="Search Algo..." class="flex-1"
                                @keyup.enter="handleAlgoSearch" />
                            <PixelButton variant="secondary" @click="handleAlgoSearch" class="px-2">FIND</PixelButton>
                        </div>
                        <!-- Search Results Dropdown -->
                        <div v-if="algoSearchResults.length > 0"
                            class="absolute top-full left-0 w-full bg-[#2d2d2d] border border-gray-600 z-50 max-h-40 overflow-y-auto shadow-lg mt-1">
                            <div v-for="algo in algoSearchResults" :key="algo.id" @click="addAlgorithm(algo)"
                                class="p-2 text-xs text-gray-300 hover:bg-green-500/20 cursor-pointer border-b border-gray-700/50 last:border-0">
                                {{ algo.name }}
                            </div>
                        </div>
                    </div>

                    <!-- Selected Tags -->
                    <div class="flex flex-wrap gap-2 min-h-[30px] p-2 bg-black/30 border border-gray-800">
                        <span v-for="(algo, idx) in selectedAlgorithms" :key="algo.id"
                            class="px-2 py-1 bg-green-900/40 border border-green-500/50 text-green-400 text-[10px] flex items-center gap-1 rounded">
                            {{ algo.name }}
                            <button @click="removeAlgorithm(idx)" class="hover:text-white">x</button>
                        </span>
                        <span v-if="selectedAlgorithms.length === 0"
                            class="text-xs text-gray-600 block w-full text-center py-1">No tags selected</span>
                    </div>
                </div>

                <!-- Run Stats Form -->
                <div class="bg-[#1e1e1e]/90 border border-gray-700 p-4 flex flex-col gap-4">
                    <h3 class="text-sm text-purple-400 font-bold border-b border-purple-500/30 pb-2">EXECUTION STATS
                    </h3>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] text-gray-500 block mb-1">TIME (ms)</label>
                            <PixelInput type="number" v-model="execTime" placeholder="0" />
                        </div>
                        <div>
                            <label class="text-[10px] text-gray-500 block mb-1">MEMORY (KB)</label>
                            <PixelInput type="number" v-model="memory" placeholder="0" />
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-gray-500 block mb-1">RESULT</label>
                        <div class="flex gap-2">
                            <button @click="isSuccess = true"
                                class="flex-1 py-2 text-xs font-bold border transition-all"
                                :class="isSuccess ? 'bg-green-500 text-white border-green-500' : 'bg-black text-gray-600 border-gray-700'">SUCCESS</button>
                            <button @click="isSuccess = false"
                                class="flex-1 py-2 text-xs font-bold border transition-all"
                                :class="!isSuccess ? 'bg-red-500 text-white border-red-500' : 'bg-black text-gray-600 border-gray-700'">FAIL</button>
                        </div>
                    </div>
                </div>

                <!-- Strategy Input -->
                <div class="bg-[#1e1e1e]/90 border border-gray-700 p-4 flex flex-col gap-2 flex-1">
                    <label class="text-xs text-gray-400 font-bold">STRATEGY / APPROACH</label>
                    <textarea v-model="strategy"
                        class="w-full flex-1 bg-black/50 border border-gray-700 p-2 text-xs text-white resize-none outline-none focus:border-green-500"
                        placeholder="Explain your approach..."></textarea>
                </div>

                <!-- Submit Button -->
                <PixelButton variant="primary" class="w-full py-3 text-sm" @click="handleSubmit">
                    SUBMIT SOLUTION
                </PixelButton>

            </div>

        </div>
    </div>
</template>
