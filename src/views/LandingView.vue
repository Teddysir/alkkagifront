<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alert' // Import
import CommonHeader from '@/components/CommonHeader.vue'
import LandingChatInput from '@/components/chat/LandingChatInput.vue'

// 백엔드 개발자로서의 사용자 정보를 기반으로 한 인증 스토어 사용
const authStore = useAuthStore()
const alertStore = useAlertStore() // Init
const router = useRouter()

const showUI = ref(false)
const showTree = ref(false)
const showEditor = ref(true)
const promptText = ref('')

// Config
const SNOW_COUNT = 50
const TREE_WIDTH = 21

// Animation State
const codeLines = ref([])

const initCodeLines = () => {
  if (authStore.isAuthenticated) {
    const nick = authStore.user?.nickname || 'Dev'
    codeLines.value = [
      { text: `const dev = new Developer('${nick}');`, indent: 0 },
      { text: "", indent: 0 },
      { text: "if (dev.isReady()) {", indent: 0 },
      { text: "  await dev.restoreSession();", indent: 1 },
      { text: "  console.log('Welcome back.');", indent: 1 },
      { text: "}", indent: 0 },
      { text: "", indent: 0 },
      { text: "await dev.enterBattlefield();", indent: 0 },
    ]
  } else {
    codeLines.value = [
      { text: "class Challenger extends Developer {", indent: 0 },
      { text: "  constructor() {", indent: 1 },
      { text: "    super();", indent: 2 },
      { text: "    this.passion = Infinity;", indent: 2 },
      { text: "  }", indent: 1 },
      { text: "", indent: 0 },
      { text: "  async join() {", indent: 1 },
      { text: "    await this.connect();", indent: 2 },
      { text: "  }", indent: 1 },
      { text: "}", indent: 0 },
      { text: "", indent: 0 },
      { text: "const newDev = new Challenger();", indent: 0 },
      { text: "await newDev.join();", indent: 0 },
    ]
  }
}

const displayedLines = ref([])
const currentLineIndex = ref(0)
const currentCharIndex = ref(0)

// Tree Pixel Map (0: empty, 1: green, 2: red, 3: white, 4: brown, 5: star)
const rawMap = [
  "000000000050000000000",
  "000000000111000000000",
  "000000001131100000000",
  "000000011111110000000",
  "000000112111111000000",
  "000000001131100000000",
  "000000011111110000000",
  "000000111121111000000",
  "000001113111111100000",
  "000011111111211110000",
  "000000011113110000000",
  "000000111211111000000",
  "000001111111111100000",
  "000011131111111311000",
  "000111111121111111100",
  "001111111111111111110",
  "000000011111110000000",
  "000000112111311000000",
  "000001111111111100000",
  "000011111112111110000",
  "000111311111111311000",
  "001111111111111111110",
  "011111112111111111110",
  "111131111111111131111",
  "000000004444400000000",
  "000000004444400000000",
  "000000004444400000000",
]

const pixels = computed(() => {
  const result = []
  rawMap.forEach((rowStr) => {
    rowStr.split('').forEach((char) => {
      result.push({ type: Number(char) })
    })
  })
  return result
})

const snowflakes = Array.from({ length: SNOW_COUNT }).map(() => ({
  style: {
    left: `${Math.random() * 100}vw`,
    animationDuration: `${3 + Math.random() * 5}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random()
  }
}))

onMounted(() => {
  initCodeLines()
  typeCode()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleKeydown = (e) => {
  if (e.key === 'Enter' && showEditor.value) {
    skipAnimation()
  }
}

const skipAnimation = () => {
  showEditor.value = false
  showTree.value = true
  showUI.value = true
}

const typeCode = () => {
  if (!showEditor.value) return
  if (currentLineIndex.value >= codeLines.value.length) {
    setTimeout(() => {
      showEditor.value = false
      setTimeout(() => {
        showTree.value = true
        showUI.value = true
      }, 500)
    }, 800)
    return
  }

  const targetLine = codeLines.value[currentLineIndex.value]
  if (displayedLines.value.length <= currentLineIndex.value) {
    displayedLines.value.push({ text: '', indent: targetLine.indent })
  }

  if (currentCharIndex.value < targetLine.text.length) {
    displayedLines.value[currentLineIndex.value].text += targetLine.text[currentCharIndex.value]
    currentCharIndex.value++
    setTimeout(typeCode, 40)
  } else {
    currentLineIndex.value++
    currentCharIndex.value = 0
    setTimeout(typeCode, 150)
  }
}

const getPixelClass = (type) => {
  switch (type) {
    case 1: return 'bg-green-600 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.3)]'
    case 2: return 'bg-red-500 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.3)]'
    case 3: return 'bg-white shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1)]'
    case 4: return 'bg-[#8B4513] shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.4)]'
    case 5: return 'bg-yellow-400 shadow-[0_0_10px_#facc15] animate-pulse'
    default: return 'invisible'
  }
}

const getExtraClasses = (type) => {
  if ([1, 2, 3].includes(type)) return 'animate-shine'
  return ''
}

const goToCampaign = () => {
  if (authStore.isAuthenticated) {
    router.push('/campaigns')
  } else {
    alertStore.showAlert('ACCESS DENIED', '로그인이 필요한 서비스입니다.')
    router.push('/login')
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center relative overflow-hidden font-mono select-none">

    <transition name="fade-editor">
      <div v-if="showEditor" class="absolute inset-0 z-30 flex items-center justify-center bg-[#1e1e1e]">
        <div class="w-full max-w-2xl p-6 rounded-lg font-mono text-sm md:text-lg text-gray-300 relative group">
          <div class="flex flex-col gap-1">
            <div v-for="(line, idx) in displayedLines" :key="idx" class="flex">
              <span class="text-gray-600 mr-4 w-6 text-right select-none">{{ idx + 1 }}</span>
              <div class="whitespace-pre" :style="{ paddingLeft: `${line.indent * 1.5}rem` }">
                <span class="text-[#9cdcfe] font-medium">{{ line.text }}</span>
                <span v-if="idx === displayedLines.length - 1"
                  class="animate-pulse bg-white w-2 h-5 inline-block align-middle ml-1"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Fixed Skip Button -->
    <transition name="fade">
      <button v-if="showEditor" @click="skipAnimation"
        class="fixed bottom-8 right-8 z-50 text-gray-500 hover:text-white transition-colors tracking-widest text-sm font-bold animate-pulse bg-black/20 px-4 py-2 rounded border border-gray-700 hover:border-white hover:bg-black/50 backdrop-blur-sm">
        SKIP [ENTER] >
      </button>
    </transition>

    <div class="absolute inset-0 pointer-events-none z-0">
      <div v-for="(flake, i) in snowflakes" :key="i"
        class="absolute top-[-10px] w-1 h-1 bg-white rounded-full animate-fall" :style="flake.style"></div>
    </div>

    <transition name="fade-slow">
      <CommonHeader v-if="showUI" :transparent="true" />
    </transition>

    <transition name="fade-slow">
      <div v-if="showTree" class="absolute inset-0 z-10 flex flex-col items-center justify-center">

        <div @click="goToCampaign"
          class="relative scale-[2.0] md:scale-[2.4] mb-12 cursor-pointer hover:scale-[2.2] md:hover:scale-[2.6] transition-all duration-500 ease-out hover:filter hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          title="Start Adventure">
          <div class="grid" :style="{ gridTemplateColumns: `repeat(${TREE_WIDTH}, 0.5rem)`, gap: '1px' }">
            <div v-for="(pixel, i) in pixels" :key="i" class="w-2 h-2 transition-all duration-300"
              :class="[getPixelClass(pixel.type), getExtraClasses(pixel.type)]"></div>
          </div>
        </div>

        <div class="absolute bottom-[8vh] left-0 w-full flex justify-center px-4">
          <LandingChatInput />
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
@keyframes fall {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(105vh);
  }
}

@keyframes shine {

  0%,
  100% {
    filter: brightness(1);
  }

  50% {
    filter: brightness(1.5) contrast(1.2);
  }
}

.animate-fall {
  animation: fall linear infinite;
}

.animate-shine {
  animation: shine 2s infinite ease-in-out;
}

/* 호버 시 장식물들 반짝임 속도 증가 */
div[title="Start Adventure"]:hover .animate-shine {
  animation-duration: 0.8s;
}

.fade-editor-leave-active {
  transition: opacity 0.5s ease;
}

.fade-editor-leave-to {
  opacity: 0;
}

.fade-slow-enter-active {
  transition: opacity 2.5s ease-in-out;
}

.fade-slow-enter-from {
  opacity: 0;
}

.pixelated {
  image-rendering: pixelated;
}
</style>