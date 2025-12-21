<script setup>
import { computed } from 'vue'

const props = defineProps({
    title: String,
    message: String,
    type: String, // 'alert' | 'confirm'
    variant: String, // 'info' | 'warning'
    onConfirm: Function,
    onCancel: Function
})

const headerColorClass = computed(() => {
    return props.variant === 'warning' ? 'bg-[#808000]' : 'bg-[#000080]'
})

const icon = computed(() => {
    return props.variant === 'warning' ? '⚠️' : 'ℹ️'
})
</script>

<template>
    <!-- Default Variant: Navy/Olive Theme -->
    <div
        class="bg-[#c0c0c0] p-[2px] shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] min-w-[300px] max-w-[450px]">
        <!-- Title Bar -->
        <div :class="[headerColorClass, 'px-2 py-1 flex items-center justify-between mb-4']">
            <span class="text-white font-bold text-sm tracking-wide font-mono">{{ title }}</span>
            <button @click="onCancel"
                class="bg-[#c0c0c0] w-5 h-5 flex items-center justify-center shadow-[inset_-1px_-1px_#000000,inset_1px_1px_#ffffff] active:shadow-[inset_1px_1px_#000000]">
                <span class="text-black text-xs font-bold leading-none">✕</span>
            </button>
        </div>

        <!-- Content Area -->
        <div class="px-4 pb-6 flex gap-4 min-h-[80px] items-center">
            <!-- Icon -->
            <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <span class="text-4xl">{{ icon }}</span>
            </div>

            <!-- Message -->
            <p class="text-black font-mono text-sm leading-relaxed whitespace-pre-wrap flex-1">{{ message }}</p>
        </div>

        <!-- Button Area -->
        <div class="flex justify-center gap-4 pb-4 px-4">
            <button @click="onConfirm"
                class="px-6 py-1 bg-[#c0c0c0] flex-1 shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px] hover:bg-gray-300">
                <span
                    class="text-black font-bold font-mono text-sm leading-none border border-transparent border-dashed focus:border-black">OK</span>
            </button>
            <button v-if="type === 'confirm'" @click="onCancel"
                class="px-6 py-1 bg-[#c0c0c0] flex-1 shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px] hover:bg-gray-300">
                <span class="text-black font-bold font-mono text-sm leading-none">Cancel</span>
            </button>
        </div>
    </div>
</template>
