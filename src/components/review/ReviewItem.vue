<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { createReview, deleteReview, updateReview, toggleLikeReview } from '@/api/review'
import PixelDefaultAlert from '@/components/alerts/PixelDefaultAlert.vue'
import PixelErrorAlert from '@/components/alerts/PixelErrorAlert.vue'

const props = defineProps({
    review: Object,
    submissionId: [Number, String],
    depth: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits(['refresh'])
const authStore = useAuthStore()

const isReplying = ref(false)
const replyContent = ref('')
const isEditing = ref(false)
const editContent = ref(props.review.content)
const isLoading = ref(false)

// Alert State
const showAlert = ref(false)
const alertMessage = ref('')
const isError = ref(false)

const triggerAlert = (message, error = false) => {
    alertMessage.value = message
    isError.value = error
    showAlert.value = true
}

// Determine if current user can edit/delete
const canManage = computed(() => {
    // Check both id and userId just in case
    const currentUserId = authStore.user?.id || authStore.user?.userId
    return currentUserId && currentUserId === props.review.userId
})

const displayedDate = computed(() => {
    if (!props.review.createdAt) return ''

    const now = new Date()
    const created = new Date(props.review.createdAt)
    const diffMs = now - created
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays <= 7) return `${diffDays} days ago`

    return created.toLocaleString()
})

const handleLike = async () => {
    if (!authStore.isAuthenticated) {
        triggerAlert('Please login to like reviews.', true)
        return
    }
    try {
        await toggleLikeReview(props.review.id)
        emit('refresh')
    } catch (e) {
        console.error(e)
        triggerAlert('Failed to like review', true)
    }
}

const handleReply = async () => {
    if (!replyContent.value.trim()) return
    try {
        isLoading.value = true
        const res = await createReview({
            submissionId: props.submissionId,
            parentReviewId: props.review.id,
            content: replyContent.value
        })
        replyContent.value = ''
        isReplying.value = false
        // Emit refresh with scroll target
        emit('refresh', { background: true, scrollToId: res.data?.id || res.data?.data?.id })
    } catch (e) {
        console.error(e)
        triggerAlert('Failed to post reply', true)
    } finally {
        isLoading.value = false
    }
}

const handleUpdate = async () => {
    if (!editContent.value.trim()) return
    try {
        isLoading.value = true
        await updateReview(props.review.id, {
            content: editContent.value,
            code_line: props.review.codeLine // Maintain code line if any
        })
        isEditing.value = false
        emit('refresh')
    } catch (e) {
        console.error(e)
        triggerAlert('Failed to update review', true)
    } finally {
        isLoading.value = false
    }
}

const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
        isLoading.value = true
        await deleteReview(props.review.id)
        emit('refresh')
    } catch (e) {
        console.error(e)
        triggerAlert('Failed to delete review', true)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="flex flex-col gap-2 relative group">
        <!-- Alerts -->
        <PixelErrorAlert v-if="showAlert && isError" :message="alertMessage" :title="'ERROR'"
            :on-confirm="() => showAlert = false" :on-cancel="() => showAlert = false" class="z-50" />
        <PixelDefaultAlert v-if="showAlert && !isError" :message="alertMessage" :title="'NOTICE'"
            :on-confirm="() => showAlert = false" :on-cancel="() => showAlert = false" class="z-50" />

        <!-- Connector Line for Thread -->
        <div v-if="depth > 0" class="absolute -left-4 top-0 bottom-0 w-[1px] bg-gray-800"></div>

        <!-- Review Card -->
        <div
            class="bg-[#1a1a1a] border border-gray-800 p-3 rounded hover:border-gray-600 transition-colors relative z-10">
            <!-- Header -->
            <div class="flex justify-between items-start text-xs mb-2">
                <div class="flex items-center gap-2">
                    <!-- Profile Image -->
                    <div class="w-5 h-5 rounded overflow-hidden bg-gray-700 border border-gray-600 shrink-0">
                        <img v-if="review.profileImage" :src="review.profileImage" class="w-full h-full object-cover" />
                        <span v-else class="flex items-center justify-center h-full text-[10px] text-gray-400">{{
                            review.nickname?.charAt(0) }}</span>
                    </div>
                    <span class="font-bold text-blue-400">{{ review.nickname }}</span>
                    <span class="text-gray-500">{{ displayedDate }}</span>
                    <span v-if="review.codeLine" class="text-green-500 font-mono bg-green-900/30 px-1 rounded">
                        L:{{ review.codeLine }}
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <!-- Like Button -->
                    <button @click="handleLike"
                        class="flex items-center gap-1 text-gray-400 hover:text-pink-500 transition-colors group/like">
                        <span class="text-xl group-hover/like:scale-110 transition-transform">♥</span>
                        <span class="text-m font-bold">{{ review.likeCount }}</span>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div v-if="!isEditing"
                class="text-base md:text-m text-gray-200 whitespace-pre-wrap leading-relaxed mb-3 mt-1 font-sans">
                {{ review.content }}
            </div>

            <!-- Edit Mode -->
            <div v-else class="mb-2">
                <textarea v-model="editContent"
                    class="w-full bg-black border border-gray-700 text-gray-300 text-sm p-2 outline-none focus:border-green-500 h-20 resize-none font-mono"></textarea>
                <div class="flex gap-2 mt-2 justify-end">
                    <button @click="isEditing = false" class="text-xs text-gray-500 hover:text-white">CANCEL</button>
                    <button @click="handleUpdate"
                        class="text-xs bg-green-700 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                        :disabled="isLoading">
                        SAVE
                    </button>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex gap-3 text-[10px] text-gray-500 font-bold select-none border-t border-gray-800 pt-2">
                <button @click="isReplying = !isReplying" class="hover:text-blue-400">REPLY</button>
                <template v-if="canManage">
                    <button @click="isEditing = !isEditing" class="hover:text-yellow-400">EDIT</button>
                    <button @click="handleDelete" class="hover:text-red-400">DELETE</button>
                </template>
            </div>
        </div>

        <!-- Reply Input -->
        <div v-if="isReplying" class="ml-4 mt-2 mb-4 bg-[#111] p-3 border border-gray-700 rounded relative z-10">
            <div class="absolute -left-4 top-4 w-4 h-[1px] bg-gray-700"></div>
            <textarea v-model="replyContent" placeholder="Write a reply..."
                class="w-full bg-black border border-gray-800 text-gray-300 text-sm p-2 outline-none focus:border-blue-500 h-20 resize-none font-mono mb-2"></textarea>
            <div class="flex justify-end gap-2">
                <button @click="isReplying = false" class="text-xs text-gray-500 hover:text-white px-2">CANCEL</button>
                <button @click="handleReply"
                    class="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                    :disabled="isLoading">
                    POST REPLY
                </button>
            </div>
        </div>

        <!-- Recursive Children -->
        <div v-if="review.children && review.children.length > 0"
            class="flex flex-col gap-2 ml-4 mt-1 border-l border-gray-800 pl-4 py-1">
            <ReviewItem v-for="child in review.children" :key="child.id" :review="child" :submission-id="submissionId"
                :depth="depth + 1" @refresh="$emit('refresh', $event)" />
        </div>
    </div>
</template>
