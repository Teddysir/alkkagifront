<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getSubmissionDetail } from '@/api/submission'
import { getProblemDetail } from '@/api/problem'
import CommonHeader from '@/components/CommonHeader.vue'
import PixelText from '@/components/PixelText.vue'
import ReviewList from '@/components/review/ReviewList.vue'

const route = useRoute()
const submissionId = route.params.id

const isLoading = ref(true)
const submission = ref(null)
const problem = ref({})

// Editor Refs
const editorContainer = ref(null)
const editorHeight = ref(500) // Default min height
let editorInstance = null

// Global script loading state (Copied from ProblemSubmissionView)
const monacoLoaded = ref(false)
const markedLoaded = ref(false)
const parsedStrategyHtml = ref('')

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
    })
}

const getMonacoLanguage = (lang) => {
    switch (lang) {
        case 'JAVA': return 'java'
        case 'C++': return 'cpp'
        case 'PYTHON': return 'python'
        case 'JAVASCRIPT': return 'javascript'
        default: return 'plaintext'
    }
}

const initEditors = async () => {
    // Load Marked
    if (!window.marked) {
        await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js')
    }
    markedLoaded.value = true

    // Parse Strategy
    if (submission.value?.strategy) {
        parsedStrategyHtml.value = window.marked.parse(submission.value.strategy)
    }

    // Load Monaco
    if (window.monaco) {
        createEditor()
    } else {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.js')
        window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } })
        window.require(['vs/editor/editor.main'], () => {
            monacoLoaded.value = true
            createEditor()
        })
    }
}

const createEditor = () => {
    if (editorContainer.value && !editorInstance && submission.value) {
        editorInstance = window.monaco.editor.create(editorContainer.value, {
            value: submission.value.code,
            language: getMonacoLanguage(submission.value.language),
            theme: 'vs-dark',
            fontFamily: "'DungGeunMo', monospace",
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            readOnly: true,
            domReadOnly: true,
            scrollbar: {
                vertical: 'hidden',
                handleMouseWheel: false
            }
        })

        // Auto-grow logic - 코드 길이에 맞게 높이 자동 조절
        const updateHeight = () => {
            const contentHeight = editorInstance.getContentHeight()
            // 최소 500px, 최대 제한 없음 (또는 원하면 최대값 설정 가능)
            editorHeight.value = Math.max(500, contentHeight)
        }

        editorInstance.onDidContentSizeChange(updateHeight)

        // Initial sizing
        updateHeight()
    }
}

const fetchData = async () => {
    try {
        isLoading.value = true
        // 1. 제출 상세 정보 조회
        const res = await getSubmissionDetail(submissionId)
        submission.value = res.data || res

        // 2. 문제 정보 조회 (필요시)
        if (submission.value.programProblemId) {
            const pRes = await getProblemDetail(submission.value.programProblemId)
            problem.value = pRes.data
        }

        // 3. 코드 원문 가져오기 (CloudFront URL인 경우)
        if (submission.value.code && submission.value.code.startsWith('http')) {
            const originalUrl = submission.value.code;
            let codeText = '';
            let fetchSuccess = false;

            // 1. Try Proxy First
            try {
                const cloudfrontDomain = 'd3ud9ocg2cusae.cloudfront.net';
                let proxyUrl = originalUrl;

                if (proxyUrl.includes(cloudfrontDomain)) {
                    proxyUrl = proxyUrl.replace(/^https?:\/\/d3ud9ocg2cusae\.cloudfront\.net/, '/code-cdn');
                }

                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const text = await response.text();
                    if (!text.trim().startsWith('<!') && !text.trim().startsWith('<html')) {
                        codeText = text;
                        fetchSuccess = true;
                    } else {
                        console.warn('[Proxy Warning] Received HTML instead of code. Proxy might be misconfigured.');
                    }
                }
            } catch (ignore) {
                console.warn('[Proxy Error] Failed to fetch via proxy.', ignore);
            }

            // 2. Fallback: Direct Fetch (if Proxy failed or returned HTML)
            if (!fetchSuccess) {
                try {
                    console.log('Attempting direct fetch from CloudFront...');
                    const response = await fetch(originalUrl);
                    if (response.ok) {
                        codeText = await response.text();
                        fetchSuccess = true;
                    } else {
                        throw new Error('Direct fetch returned status: ' + response.status);
                    }
                } catch (e) {
                    console.error('Direct fetch failed:', e);
                }
            }

            if (fetchSuccess) {
                submission.value.code = codeText;
                if (editorInstance) {
                    editorInstance.setValue(codeText);
                }
            } else {
                submission.value.code = "// [ERROR] 소스 코드를 불러올 수 없습니다.\n// (Proxy & Direct Fetch both failed)\n// 관리자에게 문의해주세요.";
                if (editorInstance) editorInstance.setValue(submission.value.code);
            }
        }

        // 4. 에디터 및 마크다운 초기화
        isLoading.value = false
        await nextTick()
        await initEditors()

    } catch (error) {
        console.error("Failed to load data", error)
        alert("데이터를 로드하는 중 오류가 발생했습니다.")
        isLoading.value = false
    }
}

onMounted(() => {
    fetchData()
})

onBeforeUnmount(() => {
    if (editorInstance) editorInstance.dispose()
})
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative selection:bg-green-500/30">
        <!-- Background -->
        <div class="fixed inset-0 z-0">
            <img src="@/assets/pixel_city_bg.png" class="w-full h-full object-cover opacity-60 fixed"
                alt="Cyberpunk City" />
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm fixed"></div>
        </div>

        <CommonHeader class="shrink-0 relative z-20" />

        <div v-if="isLoading" class="relative z-10 flex-1 flex items-center justify-center">
            <div class="text-green-500 animate-pulse text-xl font-bold">
                <PixelText>> LOADING_DATA...</PixelText>
            </div>
        </div>

        <!-- Main Content -->
        <div v-else-if="submission"
            class="relative z-10 flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-6 flex flex-col md:flex-row gap-6 animate-slide-up">

            <!-- LEFT COLUMN: Problem + Code + Reviews -->
            <div class="flex-1 flex flex-col gap-4 min-w-0">

                <!-- Problem Info Card -->
                <div
                    class="bg-[#1e1e1e]/90 border-2 border-green-500/30 p-4 shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all hover:border-green-500/50">
                    <div class="flex justify-between items-start mb-2">
                        <h2 class="text-xl text-white font-bold truncate pr-4">
                            <PixelText>{{ problem.title || 'Loading...' }}</PixelText>
                        </h2>
                        <a :href="problem.problemLink" target="_blank"
                            class="text-xs text-blue-400 hover:underline shrink-0">[ OPEN LINK ]</a>
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

                <!-- Code Viewer (높이 자동 조절) -->
                <div
                    class="bg-[#1e1e1e]/90 border border-gray-700 flex flex-col shadow-lg relative shrink-0 transition-all hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <div class="bg-[#2d2d2d] p-2 flex justify-between items-center border-b border-gray-700 shrink-0">
                        <span class="text-xs text-gray-400 font-bold px-2">SOURCE CODE ({{ submission.language
                            }})</span>
                    </div>

                    <div ref="editorContainer" class="w-full relative" :style="{ height: editorHeight + 'px' }">
                    </div>
                </div>

                <!-- Reviews Section -->
                <div class="pb-10">
                    <ReviewList :submission-id="submissionId" />
                </div>
            </div>

            <!-- RIGHT COLUMN: Stats & Strategy -->
            <div class="w-full md:w-[400px] flex flex-col gap-4 shrink-0 pb-4">

                <!-- Algo Tags -->
                <div
                    class="bg-[#1e1e1e]/90 border border-gray-700 p-4 shadow-lg transition-all hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <label class="text-xs text-gray-400 font-bold block mb-2">ALGORITHM TAGS</label>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="algo in submission.algorithmList" :key="algo.id"
                            class="px-2 py-1 bg-green-900/40 border border-green-500/50 text-green-400 text-[10px] rounded">
                            {{ algo.name }}
                        </span>
                        <span v-if="!submission.algorithmList?.length" class="text-xs text-gray-600">No tags</span>
                    </div>
                </div>

                <!-- Exec Stats -->
                <div
                    class="bg-[#1e1e1e]/90 border border-gray-700 p-4 shadow-lg transition-all hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <h3 class="text-sm text-green-400 font-bold border-b border-gray-700 pb-2 mb-3">EXECUTION
                        STATS</h3>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <span class="text-[10px] text-gray-500 block mb-1">TIME</span>
                            <span class="text-sm text-white font-mono">{{ submission.execTime }} ms</span>
                        </div>
                        <div>
                            <span class="text-[10px] text-gray-500 block mb-1">MEMORY</span>
                            <span class="text-sm text-white font-mono">{{ Math.round(submission.memory) }}
                                KB</span>
                        </div>
                    </div>
                    <div>
                        <span class="text-[10px] text-gray-500 block mb-1">RESULT</span>
                        <span class="text-sm font-bold"
                            :class="submission.isSuccess ? 'text-green-500' : 'text-red-500'">
                            {{ submission.isSuccess ? 'PASS' : 'FAIL' }}
                        </span>
                    </div>
                </div>

                <!-- Strategy Display -->
                <div
                    class="bg-[#1e1e1e]/90 border border-gray-700 flex flex-col shadow-lg overflow-hidden flex-1 min-h-[200px] transition-all hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <div class="bg-[#2d2d2d] p-2 border-b border-gray-700 shrink-0">
                        <span class="text-xs text-gray-400 font-bold">STRATEGY</span>
                    </div>
                    <div class="p-4 bg-black/50 custom-scrollbar overflow-y-auto flex-1 markdown-preview"
                        v-html="parsedStrategyHtml"></div>
                </div>

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

/* Reuse markdown styles */
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
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
    border-bottom: 1px solid #333;
    padding-bottom: 0.2em;
}
</style>