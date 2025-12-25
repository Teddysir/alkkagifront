<script setup>
defineProps({
    title: String,
    message: String,
    onConfirm: Function,
    onCancel: Function
})
</script>

<template>
    <!-- Error Variant: Maroon Theme -->
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
            class="bg-[#c0c0c0] p-[2px] shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] min-w-[350px] max-w-[500px] animate-shake">
            <!-- Title Bar -->
            <div class="bg-[#800000] px-2 py-1 flex items-center justify-between mb-4 shadow-[inset_1px_1px_#ffffff50]">
                <span class="text-white font-bold text-sm tracking-wide font-mono flex items-center gap-2">
                    <span>⚠️</span> {{ title }}
                </span>
                <button @click="onCancel"
                    class="bg-[#c0c0c0] w-5 h-5 flex items-center justify-center shadow-[inset_-1px_-1px_#000000,inset_1px_1px_#ffffff] active:shadow-[inset_1px_1px_#000000]">
                    <span class="text-black text-xs font-bold leading-none">✕</span>
                </button>
            </div>

            <!-- Content Area -->
            <div class="px-6 pb-6 flex gap-6 min-h-[100px] items-center">
                <!-- Icon -->
                <div
                    class="w-12 h-12 bg-black border-2 border-red-500 flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                    <span class="text-3xl animate-pulse">💀</span>
                </div>

                <!-- Message -->
                <div class="flex-1">
                    <p class="text-red-900 font-bold font-mono text-sm leading-relaxed mb-1">CRITICAL FAILURE</p>
                    <p class="text-black font-mono text-xs leading-relaxed whitespace-pre-wrap">{{ message }}</p>
                </div>
            </div>

            <!-- Button Area -->
            <div class="flex justify-center gap-4 pb-4 px-4">
                <button @click="onConfirm"
                    class="flex-1 py-2 bg-[#c0c0c0] shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px] hover:bg-gray-300 transition-colors group">
                    <span
                        class="text-red-900 font-bold font-mono text-sm leading-none group-hover:underline">OK..</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-shake {
    animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
}

@keyframes shake {

    10%,
    90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%,
    80% {
        transform: translate3d(2px, 0, 0);
    }

    30%,
    50%,
    70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%,
    60% {
        transform: translate3d(4px, 0, 0);
    }
}
</style>
