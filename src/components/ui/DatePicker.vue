<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: 'Select date'
    }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref(null)

// Current view for calendar
const viewDate = ref(new Date())
const selectedDate = ref(null)
const timeValue = ref('10:30:00')

// Parse initial value
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        const d = new Date(newVal)
        if (!isNaN(d.getTime())) {
            selectedDate.value = d
            viewDate.value = new Date(d) // Sync view to selected

            // Extract Time
            const hours = String(d.getHours()).padStart(2, '0')
            const minutes = String(d.getMinutes()).padStart(2, '0')
            const seconds = String(d.getSeconds()).padStart(2, '0')
            timeValue.value = `${hours}:${minutes}:${seconds}`
        }
    }
}, { immediate: true })

// Calendar Logic
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

const currentMonthYear = computed(() => {
    return `${monthNames[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`
})

const daysInMonth = computed(() => {
    const year = viewDate.value.getFullYear()
    const month = viewDate.value.getMonth()
    return new Date(year, month + 1, 0).getDate()
})

const firstDayOffset = computed(() => {
    const year = viewDate.value.getFullYear()
    const month = viewDate.value.getMonth()
    return new Date(year, month, 1).getDay()
})

const calendarDays = computed(() => {
    const days = []
    // Padding
    for (let i = 0; i < firstDayOffset.value; i++) {
        days.push(null)
    }
    // Days
    for (let i = 1; i <= daysInMonth.value; i++) {
        days.push(new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), i))
    }
    return days
})

// Methods
const toggleOpen = () => isOpen.value = !isOpen.value

const prevMonth = () => {
    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

const isSelected = (date) => {
    if (!date || !selectedDate.value) return false
    return date.getDate() === selectedDate.value.getDate() &&
        date.getMonth() === selectedDate.value.getMonth() &&
        date.getFullYear() === selectedDate.value.getFullYear()
}

const selectDate = (date) => {
    if (!date) return
    selectedDate.value = date
    // isOpen.value = false // Shadcn keeps it open usually? Or maybe closes. The prompt implies separate date and time.
    // The prompt shows PopoverContent closing on select in the React code: `setOpen(false)`.
    // BUT we have a time picker next to it or inside?
    // User Prompt: "calendar... setOpen(false)" in onSelect.
    // However, user also has a separate Time picker adjacent in the flex container.
    // Wait, the prompt shows TWO cols in flex gap-4: one for Date, one for Time.
    // So selecting date updates the date part, but time is separate input.
    updateModel()
    isOpen.value = false
}

const updateModel = () => {
    if (!selectedDate.value) return

    const [h, m, s] = timeValue.value.split(':').map(Number)

    // Create new date object with time
    const finalDate = new Date(selectedDate.value)
    finalDate.setHours(h || 0)
    finalDate.setMinutes(m || 0)
    finalDate.setSeconds(s || 0)

    // Emit ISO string (local time preserved? standard ISO is UTC. 
    // Backend usually expects simple ISO. 
    // Let's rely on standard typical behavior: send what user sees as local, or UTC?
    // The Prompt code uses `date` state and `defaultValue="10:30:00"`.
    // I will combine them.

    // Adjustment to ensure we don't shift timezone if using toISOString() directly on local date
    // Actually, usually forms send ISO. I'll stick to ISO but manage the offset or just send local string if backend handles it.
    // The existing code used `new Date(...).toISOString()`. I will do the same.
    emit('update:modelValue', finalDate.toISOString()) // or toLocaleString if needed, but ISO is safer.
}

const handleTimeChange = (e) => {
    timeValue.value = e.target.value
    updateModel()
}

const formatDisplayDate = (date) => {
    if (!date) return props.placeholder
    return date.toLocaleDateString()
}

// Click Outside
const handleClickOutside = (e) => {
    if (containerRef.value && !containerRef.value.contains(e.target)) {
        isOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside)
})

</script>

<template>
    <div class="flex gap-4 font-sans items-end w-full">
        <!-- Date Picker -->
        <div class="flex flex-col gap-2 relative flex-1" ref="containerRef">
            <label class="px-1 text-xs font-medium text-gray-300">Date</label>

            <button type="button" @click="toggleOpen" :class="cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-gray-700 bg-[#0a0a0a] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/5 transition-colors',
                !selectedDate && 'text-muted-foreground'
            )">
                <div class="flex items-center gap-2 text-gray-200">
                    <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
                    <span :class="!selectedDate ? 'text-gray-500' : 'text-white'">
                        {{ selectedDate ? formatDisplayDate(selectedDate) : placeholder }}
                    </span>
                </div>
                <ChevronDown class="h-4 w-4 opacity-50 text-gray-400" />
            </button>

            <!-- Calendar Popover -->
            <transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="translate-y-1 opacity-0 scale-95" enter-to-class="translate-y-0 opacity-100 scale-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="translate-y-0 opacity-100 scale-100"
                leave-to-class="translate-y-1 opacity-0 scale-95">
                <div v-if="isOpen"
                    class="absolute top-full mt-2 left-0 z-50 rounded-md border border-gray-700 bg-[#1e1e1e] p-3 shadow-md w-[280px]">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-4">
                        <button @click="prevMonth"
                            class="h-7 w-7 bg-transparent hover:bg-white/10 rounded-md flex items-center justify-center transition-colors">
                            <ChevronLeft class="h-4 w-4 text-white" />
                        </button>
                        <div class="text-sm font-medium text-white">
                            {{ currentMonthYear }}
                        </div>
                        <button @click="nextMonth"
                            class="h-7 w-7 bg-transparent hover:bg-white/10 rounded-md flex items-center justify-center transition-colors">
                            <ChevronRight class="h-4 w-4 text-white" />
                        </button>
                    </div>

                    <!-- Days Grid -->
                    <div class="grid grid-cols-7 gap-1 text-center mb-2">
                        <div v-for="day in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="day"
                            class="text-[0.8rem] text-muted-foreground text-gray-500 font-medium">
                            {{ day }}
                        </div>
                    </div>

                    <div class="grid grid-cols-7 gap-1">
                        <template v-for="(date, i) in calendarDays" :key="i">
                            <div v-if="!date" class="h-9 w-9"></div>
                            <button v-else @click="selectDate(date)" :class="cn(
                                'h-9 w-9 p-0 font-normal text-sm rounded-md flex items-center justify-center transition-all',
                                isSelected(date)
                                    ? 'bg-white text-black font-bold hover:bg-gray-200 focus:bg-gray-200'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white',
                                date.toDateString() === new Date().toDateString() && !isSelected(date) && 'text-green-400 font-bold'
                            )">
                                {{ date.getDate() }}
                            </button>
                        </template>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Time Picker -->
        <div class="flex flex-col gap-2">
            <label class="px-1 text-xs font-medium text-gray-300">Time</label>
            <input type="time" step="1" :value="timeValue" @change="handleTimeChange"
                class="flex h-10 w-full rounded-md border border-gray-700 bg-[#0a0a0a] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white appearance-none [&::-webkit-calendar-picker-indicator]:hidden" />
        </div>
    </div>
</template>
