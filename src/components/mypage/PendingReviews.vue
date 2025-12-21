<script setup>
import { ref } from 'vue'
import PixelText from '@/components/PixelText.vue'

const todoReviews = ref([
    { id: 1, title: 'Code Review: Login Logic', deadline: '2025-01-10' },
    { id: 2, title: 'Refactor: User Service', deadline: '2025-01-12' },
    { id: 3, title: 'Test: Payment Gateway', deadline: '2025-01-15' }
])
</script>

<template>
    <section class="h-full bg-[#1e1e1e]/80 border border-purple-500/30 p-6 pixel-window flex flex-col">
        <h3 class="text-purple-400 font-bold mb-4 flex items-center gap-2">
            <PixelText>> PENDING REVIEWS</PixelText>
            <span class="text-xs text-gray-500">({{ todoReviews.length }})</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="item in todoReviews" :key="item.id"
                class="bg-black/40 border border-purple-900/50 p-4 hover:border-purple-500 hover:bg-purple-900/10 transition-all cursor-pointer group">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs text-purple-300 font-bold">TASK #{{ item.id }}</span>
                    <span class="text-[10px] text-red-400 animate-pulse">D-{{ Math.floor(Math.random() * 5) }}</span>
                </div>
                <h4 class="text-white text-sm font-bold truncate group-hover:text-purple-300">{{ item.title }}</h4>
                <div class="mt-4 flex justify-between items-end">
                    <span class="text-[10px] text-gray-600">{{ item.deadline }}</span>
                    <button class="text-[10px] bg-purple-600 text-white px-2 py-1 hover:bg-purple-500">START</button>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.pixel-window {
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
}
</style>
