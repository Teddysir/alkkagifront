<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createCampaign } from '@/api/campaign'
import PixelText from '@/components/PixelText.vue'
import CommonHeader from '@/components/CommonHeader.vue'
import { useAlertStore } from '@/stores/alert'
import DatePicker from '@/components/ui/DatePicker.vue'

const router = useRouter()
const alertStore = useAlertStore()
const isLoading = ref(false)

const form = ref({
    title: '',
    description: '',
    capacity: 10,
    startDate: '', // Bound to datetime-local
    endDate: ''   // Bound to datetime-local
})
const thumbnailFile = ref(null)
const thumbnailPreview = ref(null)

const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
        thumbnailFile.value = file
        // Create preview URL
        const reader = new FileReader()
        reader.onload = (e) => {
            thumbnailPreview.value = e.target.result
        }
        reader.readAsDataURL(file)
    }
}

const handleSubmit = async () => {
    if (isLoading.value) return

    // Basic validation
    if (!form.value.title || !form.value.startDate || !form.value.endDate) {
        alertStore.showAlert('VALIDATION ERROR', 'Please fill in all required fields.')
        return
    }

    isLoading.value = true

    try {
        const formData = new FormData()

        // 1. Campaign Data (JSON string as 'campaign' key)
        const campaignData = {
            title: form.value.title,
            description: form.value.description,
            capacity: form.value.capacity,
            startDate: new Date(form.value.startDate).toISOString(), // Ensure ISO format
            endDate: new Date(form.value.endDate).toISOString()
        }

        // Append as Blob with application/json type to ensure backend parses it correctly as @RequestPart
        const jsonBlob = new Blob([JSON.stringify(campaignData)], { type: 'application/json' })
        formData.append('campaign', jsonBlob)

        // 2. Thumbnail File
        if (thumbnailFile.value) {
            formData.append('thumbnail', thumbnailFile.value)
        }

        await createCampaign(formData)
        await alertStore.showAlert('SUCCESS', 'MISSION CREATED SUCCESSFULLY')
        router.push('/campaigns')
    } catch (error) {
        console.error('Failed to create campaign:', error)
        alertStore.showAlert('ERROR', 'FAILED TO DEPLOY MISSION. CHECK CONSOLE.')
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] font-mono flex flex-col relative overflow-hidden">
        <!-- Background -->
        <div class="absolute inset-0 z-0">
            <img src="@/assets/pixel_city_bg.png" class="w-full h-full object-cover opacity-60" alt="Cyberpunk City" />
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        </div>

        <CommonHeader />

        <div class="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
            <div class="w-full max-w-2xl bg-[#1e1e1e] border-2 border-green-500/50 p-6 md:p-8 pixel-window relative">
                <!-- Decorative Header -->
                <div
                    class="absolute top-0 left-0 right-0 h-8 bg-green-500/10 border-b border-green-500/30 flex items-center px-4 justify-between">
                    <PixelText variant="small" class="text-green-500">>> SYSTEM_ADMIN_ACCESS</PixelText>
                    <div class="flex items-center gap-4">
                        <div class="flex gap-1">
                            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div class="w-2 h-2 bg-green-500/30 rounded-full"></div>
                        </div>
                        <button @click="router.back()" class="text-gray-500 hover:text-white transition-colors">
                            <PixelText>X</PixelText>
                        </button>
                    </div>
                </div>

                <h1 class="text-2xl md:text-3xl text-white mb-8 mt-6 text-center">
                    <PixelText>DEPLOY NEW MISSION</PixelText>
                </h1>

                <form @submit.prevent="handleSubmit" class="space-y-6">
                    <!-- Title -->
                    <div class="space-y-2">
                        <label class="text-xs text-green-400 font-bold block">
                            <PixelText>MISSION TITLE</PixelText>
                        </label>
                        <input v-model="form.title" type="text"
                            class="w-full bg-black/50 border border-gray-600 focus:border-green-500 text-white p-3 outline-none transition-colors font-sans"
                            placeholder="캠페인 제목을 입력해주세요." required />
                    </div>

                    <!-- Description -->
                    <div class="space-y-2">
                        <label class="text-xs text-green-400 font-bold block">
                            <PixelText>MISSION BRIEF</PixelText>
                        </label>
                        <textarea v-model="form.description" rows="4"
                            class="w-full bg-black/50 border border-gray-600 focus:border-green-500 text-white p-3 outline-none transition-colors font-sans resize-none"
                            placeholder="캠페인 설명을 입력해주세요."></textarea>
                    </div>

                    <!-- Capacity -->
                    <div class="space-y-2">
                        <label class="text-xs text-green-400 font-bold block">
                            <PixelText>UNIT CAPACITY</PixelText>
                        </label>
                        <input v-model.number="form.capacity" type="number" min="1"
                            class="w-full bg-black/50 border border-gray-600 focus:border-green-500 text-white p-3 outline-none transition-colors font-sans" />
                    </div>

                    <!-- Dates Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-xs text-green-400 font-bold block">
                                <PixelText>START TIME</PixelText>
                            </label>
                            <DatePicker v-model="form.startDate" placeholder="Select start date" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs text-green-400 font-bold block">
                                <PixelText>END TIME</PixelText>
                            </label>
                            <DatePicker v-model="form.endDate" placeholder="Select end date" />
                        </div>
                    </div>

                    <!-- File Upload -->
                    <div class="space-y-2">
                        <label class="text-xs text-green-400 font-bold block">
                            <PixelText>INTEL IMAGE (THUMBNAIL)</PixelText>
                        </label>
                        <div class="flex items-start gap-4">
                            <label
                                class="cursor-pointer bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 transition-colors flex items-center gap-2">
                                <span class="text-2xl leading-none font-bold">+</span>
                                <span class="text-xs font-bold">UPLOAD</span>
                                <input type="file" @change="handleFileChange" accept="image/*" class="hidden" />
                            </label>

                            <div v-if="thumbnailPreview" class="w-20 h-20 border border-gray-600 bg-black">
                                <img :src="thumbnailPreview" class="w-full h-full object-cover" />
                            </div>
                            <div v-else class="text-gray-600 text-xs py-3">NO FILE SELECTED</div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" :disabled="isLoading"
                        class="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 mt-8 transition-all hover:translate-y-[-2px] hover:shadow-[0_4px_0_#000]">
                        <PixelText variant="title">INITIATE LAUNCH SEQUENCE</PixelText>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pixel-window {
    box-shadow: 8px 8px 0px #000000;
}

input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
}
</style>
