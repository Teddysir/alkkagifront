<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProblemDetail } from '@/api/problem'
import { searchAlgorithms, submitCode } from '@/api/submission'
import CommonHeader from '@/components/CommonHeader.vue'
import PixelText from '@/components/PixelText.vue'
import PixelButton from '@/components/PixelButton.vue'
import PixelInput from '@/components/PixelInput.vue'

import PixelDefaultAlert from '@/components/alerts/PixelDefaultAlert.vue'
import PixelErrorAlert from '@/components/alerts/PixelErrorAlert.vue'

const route = useRoute()
const router = useRouter()
const { campaignId, problemId } = route.params

const isLoading = ref(true)
const problem = ref({})

// Alert State
const showAlert = ref(false)
const alertMessage = ref('')
const isAlertError = ref(false)
const onAlertConfirm = ref(null)

const triggerAlert = (message, isError = false, confirmCallback = null) => {
    alertMessage.value = message
    isAlertError.value = isError
    onAlertConfirm.value = confirmCallback
    showAlert.value = true
}

const closeAlert = () => {
    if (onAlertConfirm.value) {
        onAlertConfirm.value()
    }
    showAlert.value = false
    onAlertConfirm.value = null
}

const defaultCodeTemplates = {
    'JAVA': `public class Main {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello World");
    }
}`,
    'C++': `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Write your code here
    return 0;
}`,
    'PYTHON': `import sys

def solution():
    // Write your code here
    pass

if __name__ == '__main__':
    solution()`,
    'JAVASCRIPT': `const fs = require('fs');
const input = fs.readFileSync('/dev/stdin').toString().trim().split('\\n');

function solution() {
    // Write your code here
}

solution();`
}

// Submission Form Data
const language = ref('JAVA') // Default
const code = ref(defaultCodeTemplates['JAVA'])
const strategy = ref('')
const execTime = ref(0)
const memory = ref(0)
const isSuccess = ref(true)

// Algorithm Search
const algoKeyword = ref('')
const algoSearchResults = ref([])
const selectedAlgorithms = ref([])

// Editor Refs
const editorContainer = ref(null)
const strategyContainer = ref(null) // New container for Markdown
let editorInstance = null
let strategyInstance = null // New instance for Markdown

// Markdown Preview State
const strategyMode = ref('WRITE') // WRITE | PREVIEW
const parsedStrategyHtml = ref('')

// Auto-grow Editor Refs
const editorHeight = ref(500) // Default min height





// Fetch Problem Detail
const fetchDetail = async () => {
    try {
        isLoading.value = true
        const res = await getProblemDetail(problemId)
        console.log(res)
        problem.value = res.data
    } catch (e) {
        console.error(e)
        triggerAlert('Failed to load problem details', true)
    } finally {
        isLoading.value = false
    }
}

// ... Algorithm Logic ...

// Submit Logic
const handleSubmit = async () => {
    // Sync code from editor just in case
    if (editorInstance) {
        code.value = editorInstance.getValue()
    }
    // Sync strategy from editor
    if (strategyInstance) {
        strategy.value = strategyInstance.getValue()
    }

    if (!code.value || !strategy.value) {
        triggerAlert('Please fill in all fields (Code & Strategy).', true)
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
        triggerAlert('SUBMISSION COMPLETE!', false, () => {
            router.push(`/campaigns/${campaignId}`)
        })
    } catch (e) {
        console.error(e)
        triggerAlert('Submission Failed', true)
    }
}

// ... Languages ...

// Global script loading state
const monacoLoaded = ref(false)
const markedLoaded = ref(false)

// ... loadScript, initEditors, createEditors ...
// Since this block is large, I should limit replacement scope carefully or ensure I copy *everything* correctly.
// I will target the imports and helper definitions first to minimize risk.
// Wait, I can't target imports easily if I only select part of the file. 
// I will implement alerts state and imports in one go.
// The rest of logic (templates, etc) is unchanged, I will use ... if allowed, but replacement must be exact.
// I will re-write carefully.

// NO, this file is huge. I should use `multi_replace_file_content` or targeted `replace_file_content`.
// I will start by adding imports and state at the top.



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



const languages = ['JAVA', 'C++', 'PYTHON', 'JAVASCRIPT']

const getMonacoLanguage = (lang) => {
    switch (lang) {
        case 'JAVA': return 'java'
        case 'C++': return 'cpp'
        case 'PYTHON': return 'python'
        case 'JAVASCRIPT': return 'javascript'
        default: return 'plaintext'
    }
}



const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
    })
}

const initEditors = async () => {
    // Load Marked (for MD preview)
    if (!window.marked) {
        await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js')
    }
    markedLoaded.value = true

    // Load Monaco
    if (window.monaco) {
        createEditors()
    } else {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.js')
        window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } })
        window.require(['vs/editor/editor.main'], () => {
            monacoLoaded.value = true
            createEditors()
        })
    }
}

const createEditors = () => {
    // 1. Code Editor
    if (editorContainer.value && !editorInstance) {
        editorInstance = window.monaco.editor.create(editorContainer.value, {
            value: code.value,
            language: getMonacoLanguage(language.value),
            theme: 'vs-dark',
            fontFamily: "'DungGeunMo', monospace",
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            scrollbar: {
                vertical: 'hidden',
                handleMouseWheel: false
            }
        })

        const updateHeight = () => {
            const contentHeight = editorInstance.getContentHeight()
            editorHeight.value = Math.max(500, contentHeight)
            editorContainer.value.style.height = `${editorHeight.value}px`
        }

        editorInstance.onDidContentSizeChange(updateHeight)
        // Initial height update
        updateHeight()

        editorInstance.onDidChangeModelContent(() => {
            code.value = editorInstance.getValue()
        })

        editorInstance.onDidChangeModelContent(() => {
            code.value = editorInstance.getValue()
        })
    }

    // 2. Strategy Editor (Markdown)
    // Only create if in WRITE mode and container exists
    if (strategyContainer.value && !strategyInstance && strategyMode.value === 'WRITE') {
        createStrategyEditor()
    }
}

const createStrategyEditor = () => {
    if (!strategyContainer.value || strategyInstance) return

    strategyInstance = window.monaco.editor.create(strategyContainer.value, {
        value: strategy.value,
        language: 'markdown',
        theme: 'vs-dark',
        fontFamily: "'DungGeunMo', monospace",
        fontSize: 12, // Slightly smaller for text
        minimap: { enabled: false },
        lineNumbers: 'off', // Cleaner for writing prose
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 }
    })

    strategyInstance.onDidChangeModelContent(() => {
        strategy.value = strategyInstance.getValue()
    })
}

// Markdown Tabs Logic
const setStrategyMode = (mode) => {
    // Sync before switch
    if (strategyInstance) {
        strategy.value = strategyInstance.getValue()
    }

    strategyMode.value = mode

    if (mode === 'PREVIEW') {
        if (window.marked) {
            parsedStrategyHtml.value = window.marked.parse(strategy.value || '> No content.')
        } else {
            parsedStrategyHtml.value = 'Preview module loading...'
        }
    } else {
        // Switching back to WRITE
        // We need nextTick because v-if destroys the container
        nextTick(() => {
            // Dispose old if exists (safeguard)
            if (strategyInstance) {
                strategyInstance.dispose()
                strategyInstance = null
            }
            createStrategyEditor()
        })
    }
}

watch(language, (newLang) => {
    if (editorInstance) {
        const model = editorInstance.getModel()
        window.monaco.editor.setModelLanguage(model, getMonacoLanguage(newLang))

        const newCode = defaultCodeTemplates[newLang] || ''
        editorInstance.setValue(newCode)
        code.value = newCode
    }
})

onMounted(() => {
    fetchDetail()
    initEditors()
})

onBeforeUnmount(() => {
    if (editorInstance) editorInstance.dispose()
    if (strategyInstance) strategyInstance.dispose()
})
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative selection:bg-green-500/30">

        <!-- Alerts -->
        <PixelDefaultAlert v-if="showAlert && !isAlertError" :message="alertMessage" @confirm="closeAlert"
            @cancel="closeAlert" />
        <PixelErrorAlert v-if="showAlert && isAlertError" title="ERROR" :message="alertMessage" @confirm="closeAlert"
            @cancel="closeAlert" />

        <!-- Background -->
        <div class="absolute inset-0 z-0">
            <img src="@/assets/pixel_city_bg.png" class="w-full h-full object-cover opacity-60 fixed"
                alt="Cyberpunk City" />
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm fixed"></div>
        </div>

        <CommonHeader class="shrink-0 relative z-20" />

        <!-- Main Layout: Scrollable Body -->
        <div
            class="relative z-10 flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-6 flex flex-col md:flex-row gap-6 animate-slide-up">

            <!-- LEFT: Problem Info & Code Editor -->
            <div class="flex-1 flex flex-col gap-4 min-w-0">
                <!-- Problem Info Card -->
                <div
                    class="bg-[#1e1e1e]/90 border-2 border-green-500/30 p-4 shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                    <div class="flex justify-between items-start mb-2">
                        <h2 class="text-xl text-white font-bold truncate pr-4">
                            <PixelText>{{ problem.title || 'Loading...' }}</PixelText>
                        </h2>
                        <a :href="problem.problemLink" target="_blank"
                            class="text-xs text-blue-400 hover:underline shrink-0">[
                            OPEN LINK ]</a>
                    </div>
                    <div class="flex gap-4 text-xs text-gray-400">
                        <span>NO: {{ problem.problemNo }}</span>
                        <span>PLATFORM: {{ problem.platformType }}</span>
                        <span
                            :class="{ 'text-green-400': problem.difficultyType === 'EASY', 'text-red-400': problem.difficultyType === 'HARD' }">
                            LV: {{ problem.difficultyType }}
                        </span>
                    </div>
                </div>

                <!-- Code Editor Area -->
                <div
                    class="flex-1 bg-[#1e1e1e]/90 border-2 border-gray-700/50 flex flex-col shadow-[0_0_15px_rgba(34,197,94,0.05)] relative transition-all hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                    <div class="bg-[#2d2d2d] p-2 flex justify-between items-center border-b border-gray-700 shrink-0">
                        <span class="text-xs text-gray-400 font-bold px-2">SOURCE CODE</span>
                        <select v-model="language"
                            class="bg-black text-white text-xs p-1.5 border border-gray-600 focus:border-green-500 outline-none pixel-font">
                            <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
                        </select>
                    </div>
                    <!-- Monaco Container -->
                    <div ref="editorContainer" class="w-full relative" :style="{ height: editorHeight + 'px' }"></div>
                </div>
            </div>

            <!-- RIGHT: Submission Stats & Algo -->
            <div class="w-full md:w-[400px] flex flex-col gap-4 shrink-0">
                <div class="flex flex-col gap-4 pb-4">

                    <!-- Algorithm Selector -->
                    <div
                        class="bg-[#1e1e1e]/90 border-2 border-gray-700/50 p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(34,197,94,0.05)] shrink-0 transition-all hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                        <label class="text-xs text-gray-400 font-bold">ALGORITHM TAGS</label>
                        <div class="relative">
                            <div class="flex gap-2">
                                <PixelInput v-model="algoKeyword" placeholder="Algorithms.." class="flex-1"
                                    @keyup.enter="handleAlgoSearch" />
                                <PixelButton variant="secondary" text="FIND" @click="handleAlgoSearch"
                                    class="!h-10 !px-4 !text-xs" />
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
                    <div
                        class="bg-[#1e1e1e]/90 border-2 border-gray-700/50 p-4 flex flex-col gap-4 shadow-[0_0_15px_rgba(34,197,94,0.05)] shrink-0 transition-all hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                        <h3 class="text-sm text-green-400 font-bold border-b border-gray-700 pb-2">EXECUTION STATS
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
                                <PixelButton text="SUCCESS" class="flex-1 !h-10 !text-xs"
                                    :variant="isSuccess ? 'primary' : 'secondary'"
                                    :class="isSuccess ? '!bg-green-600 !text-white !shadow-[inset_-2px_-2px_#003300,inset_2px_2px_#88ff88]' : '!opacity-50'"
                                    @click="isSuccess = true" />
                                <PixelButton text="FAIL" class="flex-1 !h-10 !text-xs"
                                    :variant="!isSuccess ? 'danger' : 'secondary'"
                                    :class="!isSuccess ? '' : '!opacity-50'" @click="isSuccess = false" />
                            </div>
                        </div>
                    </div>

                    <!-- Strategy Input (Markdown) -->
                    <div
                        class="bg-[#1e1e1e]/90 border-2 border-gray-700/50 flex flex-col flex-1 min-h-[400px] shadow-[0_0_15px_rgba(34,197,94,0.05)] transition-all hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                        <div class="bg-[#2d2d2d] p-1 flex gap-1 border-b border-gray-700 shrink-0">
                            <span class="text-xs text-gray-400 font-bold px-3 py-2 mr-auto self-center">STRATEGY
                                (MD)</span>

                            <button @click="setStrategyMode('WRITE')"
                                class="px-3 py-1 text-[10px] font-bold transition-all"
                                :class="strategyMode === 'WRITE' ? 'bg-gray-600 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'">
                                [ WRITE ]
                            </button>
                            <button @click="setStrategyMode('PREVIEW')"
                                class="px-3 py-1 text-[10px] font-bold transition-all"
                                :class="strategyMode === 'PREVIEW' ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'">
                                [ PREVIEW ]
                            </button>
                        </div>

                        <!-- Write Mode -->
                        <div v-show="strategyMode === 'WRITE'" ref="strategyContainer" class="flex-1 w-full relative">
                        </div>

                        <!-- Preview Mode -->
                        <div v-if="strategyMode === 'PREVIEW'"
                            class="flex-1 w-full p-4 overflow-y-auto custom-scrollbar bg-black/50 markdown-preview"
                            v-html="parsedStrategyHtml">
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <PixelButton variant="primary" class="w-full shrink-0 !h-14 !text-base shadow-lg" text="SUBMIT SOLUTION"
                    @click="handleSubmit" />
            </div>

        </div>
    </div>
</template>

<style scoped>
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slide-up {
    animation: slideUp 0.5s ease-out forwards;
}

@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap');

.pixel-font {
    font-family: 'DungGeunMo', sans-serif;
}

/* Custom scrollbar for the right panel */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #444;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Custom Markdown Styles (No Typography Plugin) */
.markdown-preview {
    font-family: 'DungGeunMo', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    color: #d4d4d4;
}

:deep(.markdown-preview h1),
:deep(.markdown-preview h2),
:deep(.markdown-preview h3) {
    color: #4ade80;
    /* Green */
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
    border-bottom: 1px solid #333;
    padding-bottom: 0.2em;
}

:deep(.markdown-preview h1) {
    font-size: 1.5em;
}

:deep(.markdown-preview h2) {
    font-size: 1.3em;
}

:deep(.markdown-preview h3) {
    font-size: 1.1em;
}

:deep(.markdown-preview p) {
    margin-bottom: 0.8em;
}

:deep(.markdown-preview ul),
:deep(.markdown-preview ol) {
    padding-left: 1.5em;
    margin-bottom: 0.8em;
}

:deep(.markdown-preview ul) {
    list-style-type: square;
}

:deep(.markdown-preview ol) {
    list-style-type: decimal;
}

:deep(.markdown-preview code) {
    color: #fca5a5;
    /* Red-300 */
    background: #333;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: monospace;
}

:deep(.markdown-preview pre) {
    background: #000;
    border: 1px solid #333;
    padding: 1em;
    margin-bottom: 1em;
    overflow-x: auto;
}

:deep(.markdown-preview pre code) {
    color: #e5e5e5;
    background: transparent;
    padding: 0;
}

:deep(.markdown-preview blockquote) {
    border-left: 4px solid #4ade80;
    padding-left: 1em;
    color: #9ca3af;
    background: #151515;
    margin-bottom: 1em;
}

:deep(.markdown-preview strong) {
    color: #fff;
    font-weight: bold;
}

:deep(.markdown-preview em) {
    color: #fcd34d;
    /* Amber */
    font-style: italic;
}
</style>
