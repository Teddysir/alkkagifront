<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { updateUserProfile, updateProfileImage, deleteProfileImage } from '@/api/user'
import { checkNickname } from '@/api/auth'
import PixelText from '@/components/PixelText.vue'
import PixelButton from '@/components/PixelButton.vue'
import PixelInput from '@/components/PixelInput.vue'

const props = defineProps({
    user: Object
})
const emit = defineEmits(['refresh'])

// Modals
const showEditProfileModal = ref(false)
const showEditImageModal = ref(false)

// Edit Profile Form
const editForm = ref({
    nickname: '',
    description: ''
})
const nicknameChecked = ref(false)
const nicknameError = ref('')

// Edit Image Form
const imageUrl = ref('')

// --- Profile Edit Logic ---
const openEditProfile = () => {
    editForm.value.nickname = props.user.nickname
    editForm.value.description = props.user.description || ''
    nicknameChecked.value = true // Assume current nickname is valid
    nicknameError.value = ''
    showEditProfileModal.value = true
}

const handleCheckNickname = async () => {
    if (!editForm.value.nickname) return
    if (editForm.value.nickname === props.user.nickname) {
        nicknameChecked.value = true
        nicknameError.value = ''
        alert('This is your current nickname.')
        return
    }

    try {
        await checkNickname(editForm.value.nickname)
        nicknameChecked.value = true
        nicknameError.value = ''
        alert('Nickname available!')
    } catch (e) {
        nicknameChecked.value = false
        nicknameError.value = 'Nickname already taken or invalid.'
        alert('Nickname duplicate!')
    }
}

const submitEditProfile = async () => {
    if (!nicknameChecked.value) {
        alert('Please check nickname first.')
        return
    }
    try {
        await updateUserProfile({
            nickname: editForm.value.nickname,
            description: editForm.value.description
        })
        alert('Profile Updated!')
        showEditProfileModal.value = false
        emit('refresh')
    } catch (e) {
        console.error(e)
        alert('Update failed')
    }
}

// --- Image Edit Logic ---
const submitUpdateImage = async () => {
    if (!imageUrl.value) return
    try {
        await updateProfileImage(imageUrl.value)
        alert('Image Updated!')
        showEditImageModal.value = false
        imageUrl.value = ''
        emit('refresh')
    } catch (e) {
        console.error(e)
        alert('Image update failed')
    }
}

const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // In a real app, you would upload this file to S3/Cloudinary and get a URL.
    // For this mock/prototype, we'll read it as DataURL to display it immediately.
    // The prompt says "profile image edit is /api/v1/users/profile-images POST { profile_image: url }"
    // So we assume the backend expects a URL.
    // Since I cannot upload to a real server, I will simulate it by using the Base64 string as the URL
    // (Note: This might be too long for some databases, but works for frontend demo).

    const reader = new FileReader()
    reader.onload = (e) => {
        imageUrl.value = e.target.result // Base64 string
    }
    reader.readAsDataURL(file)
}

const handleDeleteImage = async () => {
    if (!confirm('Remove profile image?')) return
    try {
        await deleteProfileImage()
        alert('Image Removed')
        emit('refresh')
    } catch (e) {
        console.error(e)
        alert('Deletion failed')
    }
}
</script>

<template>
    <div
        class="h-full bg-[#1e1e1e]/90 border-2 border-green-500/50 p-6 pixel-window relative flex flex-col items-center text-center">
        <!-- Edit Pencil -->
        <button @click="openEditProfile"
            class="absolute top-4 left-4 text-green-500 hover:text-white transition-colors z-20" title="Edit Profile">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
        </button>

        <!-- Profile Image -->
        <div class="relative group cursor-pointer mb-6" @click="showEditImageModal = true">
            <div
                class="w-24 h-24 rounded-full border-4 border-green-500 overflow-hidden bg-black/50 mx-auto shadow-[0_0_15px_rgba(74,222,128,0.3)]">
                <img :src="user?.profileImage || 'https://via.placeholder.com/150'" class="w-full h-full object-cover"
                    alt="Profile" />
            </div>
            <div
                class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <span class="text-xs text-white">CHANGE IMG</span>
            </div>
            <!-- Delete Img Button -->
            <button @click.stop="handleDeleteImage"
                class="absolute bottom-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600 border border-black z-10"
                title="Delete Image">X</button>
        </div>

        <h2 class="text-2xl text-white font-bold mb-1">
            <PixelText>{{ user?.nickname || 'UNKNOWN' }}</PixelText>
        </h2>
        <span class="text-xs text-gray-500 mb-4">{{ user?.email || 'No Email' }}</span>

        <div class="w-full h-px bg-gray-700 my-4"></div>

        <p class="text-sm text-gray-300 italic leading-relaxed w-full break-words">
            "{{ user?.description || 'No description yet.' }}"
        </p>

        <!-- MODAL: EDIT PROFILE -->
        <div v-if="showEditProfileModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 text-left">
            <div
                class="bg-[#1e1e1e] border-2 border-green-500 w-full max-w-md p-6 shadow-[0_0_30px_rgba(74,222,128,0.2)] relative">
                <!-- Close Button -->
                <button @click="showEditProfileModal = false"
                    class="absolute top-4 right-4 text-gray-500 hover:text-white">X</button>

                <h3 class="text-xl text-green-400 font-bold mb-6">
                    <PixelText>> EDIT IDENTITY</PixelText>
                </h3>

                <div class="flex flex-col gap-4">
                    <div>
                        <label class="text-xs text-gray-500 mb-1 block">NICKNAME</label>
                        <div class="flex gap-2">
                            <PixelInput v-model="editForm.nickname" class="flex-1" placeholder="New Nickname"
                                @input="nicknameChecked = false" />
                            <PixelButton variant="secondary" @click="handleCheckNickname">CHECK</PixelButton>
                        </div>
                        <span v-if="nicknameError" class="text-[10px] text-red-500 mt-1">{{ nicknameError }}</span>
                        <span v-if="nicknameChecked && !nicknameError"
                            class="text-[10px] text-green-500 mt-1">Available!</span>
                    </div>

                    <div>
                        <label class="text-xs text-gray-500 mb-1 block">DESCRIPTION</label>
                        <textarea v-model="editForm.description" rows="3"
                            class="w-full bg-black border-2 border-gray-700 p-2 text-white text-sm outline-none focus:border-green-500 transition-colors placeholder:text-gray-700"></textarea>
                    </div>

                    <div class="flex gap-3 mt-4">
                        <PixelButton variant="primary" class="flex-1" @click="submitEditProfile">SAVE CHANGES
                        </PixelButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL: EDIT IMAGE -->
        <div v-if="showEditImageModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 text-left">
            <div
                class="bg-[#1e1e1e] border-2 border-blue-500 w-full max-w-md p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative">
                <!-- Close Button -->
                <button @click="showEditImageModal = false"
                    class="absolute top-4 right-4 text-gray-500 hover:text-white">X</button>

                <h3 class="text-xl text-blue-400 font-bold mb-6">
                    <PixelText>> UPDATE AVATAR</PixelText>
                </h3>

                <div class="flex flex-col gap-4">
                    <p class="text-xs text-gray-400">Select a new profile image.</p>

                    <!-- File Input -->
                    <div
                        class="border-2 border-dashed border-gray-600 bg-black/30 p-8 text-center cursor-pointer hover:border-blue-500 transition-colors relative">
                        <input type="file" accept="image/*" @change="handleFileChange"
                            class="absolute inset-0 opacity-0 cursor-pointer" />
                        <span class="text-sm text-blue-400" v-if="!imageUrl">Click to Upload File</span>
                        <span class="text-sm text-white" v-else>File Selected (Ready)</span>
                    </div>

                    <div class="flex gap-3 mt-4">
                        <PixelButton variant="primary" class="flex-1" @click="submitUpdateImage">UPLOAD SELECTED
                        </PixelButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pixel-window {
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
}
</style>
