<script setup>
import { ref, onMounted, computed } from 'vue'
import { getReviews, createReview } from '@/api/review'
import ReviewItem from './ReviewItem.vue'
import PixelText from '@/components/PixelText.vue'
import { useAuthStore } from '@/stores/auth'
import PixelDefaultAlert from '@/components/alerts/PixelDefaultAlert.vue'
import PixelErrorAlert from '@/components/alerts/PixelErrorAlert.vue'

const props = defineProps({
    submissionId: [Number, String]
})

const authStore = useAuthStore()
const isLoading = ref(true)
const newReviewContent = ref('')
const newReviewCodeLine = ref(null)
const isSubmitting = ref(false)

// Alert State
const showAlert = ref(false)
const alertMessage = ref('')
const isError = ref(false)

const triggerAlert = (message, error = false) => {
    alertMessage.value = message
    isError.value = error
    showAlert.value = true
}

// Transform flat list to tree (now a ref, populated by fetchReviews)
const threadedReviews = ref([])

const submitNewReview = async () => {
    if (!newReviewContent.value.trim()) return
    if (!authStore.isAuthenticated) {
        triggerAlert('Please login to leave a review.', true)
        return
    }

    try {
        isSubmitting.value = true
        const payload = {
            submissionId: props.submissionId,
            content: newReviewContent.value,
            parentId: null // Top level
        }
        const res = await createReview(payload)
        newReviewContent.value = ''
        // Refresh silently and scroll to the new review
        await fetchReviews({ background: true, scrollToId: res.data?.id || res.data?.data?.id })
    } catch (e) {
        console.error(e)
        triggerAlert('캠페인에 참여한 사용자만 리뷰를 남길 수 있습니다.', true)
    } finally {
        isSubmitting.value = false
    }
}

const fetchReviews = async (options = {}) => {
    // options can be boolean (old way) or object
    const background = typeof options === 'boolean' ? options : options.background
    const scrollToId = options.scrollToId

    if (!background) isLoading.value = true
    try {
        const res = await getReviews(props.submissionId)
        // Transform flat list to threaded
        const flatReviews = res.data.data // Assuming res.data.data contains the array of reviews
        const reviewMap = {}
        const roots = []

        flatReviews.forEach(r => {
            reviewMap[r.id] = { ...r, children: [] }
        })

        flatReviews.forEach(r => {
            if (r.parentReviewId) {
                if (reviewMap[r.parentReviewId]) {
                    reviewMap[r.parentReviewId].children.push(reviewMap[r.id])
                }
            } else {
                roots.push(reviewMap[r.id])
            }
        })

        // Sort children by createdAt asc (oldest first)
        Object.values(reviewMap).forEach(node => {
            node.children.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        })

        // Sort roots by createdAt desc (newest first)
        threadedReviews.value = roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        // Auto-scroll logic
        if (scrollToId) {
            await nextTick()
            const el = document.getElementById(`review-${scrollToId}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.classList.add('flash-highlight')
                setTimeout(() => el.classList.remove('flash-highlight'), 2000)
            }
        }

    } catch (e) {
        console.error(e)
    } finally {
        if (!background) isLoading.value = false
    }
}

onMounted(() => {
    if (props.submissionId) fetchReviews()
})
</script>

<template>
    <div class="flex flex-col gap-6 w-full relative">
        <!-- Alerts -->
        <PixelErrorAlert v-if="showAlert && isError" :message="alertMessage" :title="'ERROR'"
            :on-confirm="() => showAlert = false" :on-cancel="() => showAlert = false" class="z-50" />
        <PixelDefaultAlert v-if="showAlert && !isError" :message="alertMessage" :title="'NOTICE'"
            :on-confirm="() => showAlert = false" :on-cancel="() => showAlert = false" class="z-50" />

        <!-- Review Input -->
        <div class="bg-[#1e1e1e]/90 border border-gray-700 p-4 shadow-lg">
            <h3 class="text-sm text-green-400 font-bold mb-2 flex items-center gap-2">
                <PixelText>LEAVE_A_REVIEW</PixelText>
            </h3>
            <textarea v-model="newReviewContent" placeholder="Write a review..."
                class="w-full bg-black border border-gray-600 outline-none p-3 text-sm text-white font-mono h-24 resize-none focus:border-green-500 placeholder-gray-600"></textarea>
            <div class="flex justify-between items-center mt-2">
                <div class="text-[10px] text-gray-500">
                    <span v-if="newReviewCodeLine">Ref: Line {{ newReviewCodeLine }}</span>
                </div>
                <button @click="submitNewReview"
                    class="bg-green-700 hover:bg-green-600 text-white px-4 py-2 text-xs font-bold rounded shadow transition-colors disabled:opacity-50"
                    :disabled="isSubmitting">
                    SUBMIT REVIEW
                </button>
            </div>
        </div>

        <!-- Review List -->
        <div class="flex flex-col gap-4">
            <div v-if="isLoading" class="text-center text-gray-500 py-4">Loading reviews...</div>
            <div v-else-if="threadedReviews.length === 0" class="text-center text-gray-600 py-4 italic">No reviews yet.
                Be the
                first!</div>

            <template v-else>
                <ReviewItem v-for="review in threadedReviews" :key="review.id" :review="review"
                    :submission-id="submissionId" @refresh="fetchReviews" :id="`review-${review.id}`" />
            </template>
        </div>
    </div>
</template>
