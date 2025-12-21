<script setup>
import { ref } from 'vue'
import PixelText from '@/components/PixelText.vue'

const givenReviews = ref([
    { id: 1, to: 'JuniorDev', comment: 'Good effort.', rating: 4 },
    { id: 2, to: 'Newbie', comment: 'Check indentation.', rating: 4 }
])
</script>

<template>
    <section class="h-full bg-[#1e1e1e]/80 border border-gray-700/50 p-6 pixel-window flex flex-col">
        <h3 class="text-blue-400 font-bold mb-4">
            <PixelText>> SENT REVIEWS</PixelText>
        </h3>
        <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <div v-for="rev in givenReviews" :key="rev.id"
                class="p-3 bg-black/30 border border-gray-800 flex flex-col gap-1">
                <div class="flex justify-between">
                    <span class="text-xs text-blue-300 font-bold">TO: {{ rev.to }}</span>
                    <span class="text-yellow-500 text-xs">★ {{ rev.rating }}</span>
                </div>
                <p class="text-sm text-gray-400">"{{ rev.comment }}"</p>
            </div>
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
