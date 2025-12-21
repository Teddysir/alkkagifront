<script setup>
defineProps({
    title: String,
    message: String,
    onConfirm: Function,
    onCancel: Function
})
</script>

<template>
    <!-- Success Variant: Teal Theme -->
    <div
        class="bg-[#c0c0c0] p-[2px] shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] min-w-[350px] max-w-[500px] animate-popup">
        <!-- Title Bar -->
        <div class="bg-[#008080] px-2 py-1 flex items-center justify-between mb-4 shadow-[inset_1px_1px_#ffffff50]">
            <span class="text-white font-bold text-sm tracking-wide font-mono flex items-center gap-2">
                <span>✓</span> {{ title }}
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
                class="w-12 h-12 bg-white border-2 border-gray-600 flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                <span class="text-3xl animate-bounce">👍</span>
            </div>

            <!-- Message -->
            <div class="flex-1">
                <p class="text-black font-bold font-mono text-sm leading-relaxed mb-1">OPERATION SUCCESSFUL</p>
                <p class="text-gray-700 font-mono text-xs leading-relaxed whitespace-pre-wrap">{{ message }}</p>
            </div>
        </div>

        <!-- Button Area -->
        <div class="flex justify-center gap-4 pb-4 px-4">
            <button @click="onConfirm"
                class="flex-1 py-2 bg-[#c0c0c0] shadow-[inset_-2px_-2px_#000000,inset_2px_2px_#ffffff] active:shadow-[inset_1px_1px_#000000] active:translate-y-[1px] hover:bg-gray-300 transition-colors">
                <span
                    class="text-black font-bold font-mono text-sm leading-none border border-transparent border-dashed focus:border-black">OK!</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.animate-popup {
    animation: popup 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popup {
    from {
        opacity: 0;
        transform: scale(0.8);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
