<script setup>
import { ref, onMounted, computed } from 'vue'

const showUI = ref(false)
const showTree = ref(false)
const showEditor = ref(true)

// Config
const SNOW_COUNT = 50
const TREE_WIDTH = 21 // odd number for symmetry (From User Snippet)

// VS Code Animation State
const codeLines = [
  { text: "const christmas = new Holiday('Winter');", indent: 0 },
  { text: "const tree = new Tree({", indent: 0 },
  { text: "  type: 'Evergreen',", indent: 1 },
  { text: "  height: 'Tall',", indent: 1 },
  { text: "  decoration: true", indent: 1 },
  { text: "});", indent: 0 },
  { text: "", indent: 0 },
  { text: "tree.addLights({", indent: 0 },
  { text: "  color: 'Multi',", indent: 1 },
  { text: "  mode: 'Twinkle'", indent: 1 },
  { text: "});", indent: 0 },
  { text: "", indent: 0 },
  { text: "await tree.build();", indent: 0 },
]

const displayedLines = ref([])
const currentLineIndex = ref(0)
const currentCharIndex = ref(0)

// 0: transparent, 1: green, 2: red (ornament), 3: white (light/snow), 4: brown, 5: star
// (From User Snippet)
const rawMap = [
  "000000000050000000000", // Star
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
  "111131111111111131111", // Wide base
  "000000004444400000000", // Trunk
  "000000004444400000000",
  "000000004444400000000",
]

const pixels = computed(() => {
  const result = []
  rawMap.forEach((rowStr, rowIndex) => {
    const row = rowStr.split('').map(Number)
    row.forEach((type, colIndex) => {
      // Calculate random start position for scatter effect (Keeping consistent structure but scatter unused for intro now)
      // Actually we don't need scatter positions if we just POP in.
      // But let's keep the structure simple.
      const isVisible = type !== 0
      result.push({ type, isVisible })
    })
  })
  return result
})
const activePixels = computed(() => pixels.value.filter(p => p.isVisible))

const snowflakes = Array.from({ length: SNOW_COUNT }).map(() => ({
  style: {
    left: `${Math.random() * 100}vw`,
    animationDuration: `${3 + Math.random() * 5}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random()
  }
}))

onMounted(() => {
  typeCode()
})

const typeCode = () => {
  if (currentLineIndex.value >= codeLines.length) {
    // Finished typing
    setTimeout(() => {
      showEditor.value = false
      setTimeout(() => {
        showTree.value = true
        showUI.value = true
      }, 500) // Small delay before pop
    }, 800)
    return
  }

  const targetLine = codeLines[currentLineIndex.value]
  
  if (displayedLines.value.length <= currentLineIndex.value) {
    displayedLines.value.push({ text: '', indent: targetLine.indent })
  }

  // Type characters
  if (currentCharIndex.value < targetLine.text.length) {
    displayedLines.value[currentLineIndex.value].text += targetLine.text[currentCharIndex.value]
    currentCharIndex.value++
    setTimeout(typeCode, 30 + Math.random() * 30) // Random typing speed
  } else {
    // Line finished
    currentLineIndex.value++
    currentCharIndex.value = 0
    setTimeout(typeCode, 100) // Pause between lines
  }
}

const getPixelClass = (type) => {
  // Logic from User Snippet
  switch (type) {
    case 1: return 'bg-green-600 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.3)]'
    case 2: return 'bg-red-500 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.3)]'
    case 3: return 'bg-white shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1)]'
    case 4: return 'bg-[#8B4513] shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.4)]'
    case 5: return 'bg-yellow-400 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.2)] animate-pulse'
    default: return 'invisible' // Don't render empty pixels
  }
}

// Helper for shine effect on tree pixels
const getExtraClasses = (type) => {
  if ([1,2,3].includes(type)) return 'animate-shine'
  return ''
}
</script>

<template>
  <div class="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center relative overflow-hidden font-mono select-none">
    
    <!-- VS Code Editor Container -->
    <transition name="fade-editor">
      <div v-if="showEditor" class="absolute inset-0 z-30 flex items-center justify-center bg-[#1e1e1e]">
        <div class="w-full max-w-2xl p-6 rounded-lg font-mono text-sm md:text-lg leading-relaxed text-gray-300">
          <div class="flex flex-col gap-1">
            <div 
              v-for="(line, idx) in displayedLines" 
              :key="idx" 
              class="flex"
            >
              <!-- Line Number -->
              <span class="text-gray-600 mr-4 w-6 text-right select-none">{{ idx + 1 }}</span>
              <!-- Code Content -->
              <div 
                class="whitespace-pre"
                :style="{ paddingLeft: `${line.indent * 1.5}rem` }"
              >
                <!-- Simple syntax highlights -->
                <span class="text-[#9cdcfe] font-medium">{{ line.text }}</span>
                <span v-if="idx === displayedLines.length - 1" class="animate-pulse bg-white w-2 h-5 inline-block align-middle ml-1"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Snow Container -->
    <div class="absolute inset-0 pointer-events-none z-0">
      <div 
        v-for="(flake, i) in snowflakes" 
        :key="i"
        class="absolute top-[-10px] w-1 h-1 bg-white rounded-full animate-fall"
        :style="flake.style"
      ></div>
    </div>

    <!-- Header UI -->
    <transition name="fade-slow">
      <nav v-if="showUI" class="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <div class="text-white text-3xl font-bold tracking-wider pixel-font hover:text-green-400 cursor-pointer transition-colors">
          Alkkagi
        </div>
        <div class="flex gap-6">
          <a href="#" class="text-white hover:text-green-400 transition-colors uppercase tracking-widest text-xs md:text-sm">Login</a>
          <a href="#" class="text-white hover:text-red-400 transition-colors uppercase tracking-widest text-xs md:text-sm">Sign Up</a>
        </div>
      </nav>
    </transition>

    <!-- Pixel Tree Container -->
    <!-- Large Scale + Fade In Animation (Gradient Effect) -->
    <transition name="fade-slow">
      <div v-if="showTree" class="relative z-10 scale-[2.2] md:scale-[2.6]"> <!-- Static larger scale -->
        <div 
          class="grid"
          :style="{ 
            gridTemplateColumns: `repeat(${TREE_WIDTH}, 0.5rem)`,
            gap: '1px'
          }"
        >
          <div 
            v-for="(pixel, i) in pixels" 
            :key="i"
            class="w-2 h-2" 
            :class="[getPixelClass(pixel.type), getExtraClasses(pixel.type)]"
          ></div>
        </div>
      </div>
    </transition>
    
  </div>
</template>

<style scoped>
.pixel-font {
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 2px 2px 0px #4ade80, -2px -2px 0px #f87171;
}

/* Shine / Twinkle Animation */
@keyframes shine {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.4) drop-shadow(0 0 2px rgba(255,255,255,0.8)); }
}

.animate-shine {
  animation: shine 3s infinite ease-in-out;
}

/* Snow Animation */
@keyframes fall {
  0% { transform: translateY(0); }
  100% { transform: translateY(105vh); }
}

.animate-fall {
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* UI Transitions */
.fade-editor-leave-active {
  transition: opacity 1.5s ease;
}
.fade-editor-leave-to {
  opacity: 0;
}

/* Slow Fade In for Tree & UI */
.fade-slow-enter-active {
  transition: opacity 3s ease-in-out; /* Long gradient fade */
}
.fade-slow-enter-from {
  opacity: 0;
}
</style>
