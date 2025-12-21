<script setup>
import { ref } from 'vue'
import PixelText from '@/components/PixelText.vue'

const receivedReviews = ref([
    { id: 1, from: 'DevKing', comment: 'Great structure!', rating: 5 },
    { id: 2, from: 'BugHunter', comment: 'Need more tests.', rating: 3 }
])
</script>

<template>
    <section class="h-full bg-[#1e1e1e]/80 border border-gray-700/50 p-6 pixel-window flex flex-col">
        <h3 class="text-green-400 font-bold mb-4">
            <PixelText>> RECEIVED REVIEWS</PixelText>
        </h3>
        <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <div v-for="rev in receivedReviews" :key="rev.id"
                class="p-3 bg-black/30 border border-gray-800 flex flex-col gap-1">
                <div class="flex justify-between">
                    <span class="text-xs text-green-300 font-bold">FROM: {{ rev.from }}</span>
                    <span class="text-yellow-500 text-xs">★ {{ rev.rating }}</span>
                </div>
                <p class="text-sm text-gray-400">"{{ rev.comment }}"</p>
            </div>
            <!-- More Dummy slots -->
            <div class="p-3 bg-black/30 border border-gray-800 flex justify-center py-6">
                <span class="text-xs text-gray-700">No more data</span>
            </div>
        </div>
    </section>
</template>

<style scoped>
.pixel-window {
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
}
</style>
