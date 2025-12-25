<script setup>
import { ref, defineProps, defineEmits, onMounted, computed } from 'vue'
import { useAlertStore } from '@/stores/alert' // Import
import { updateUserProfile, updateProfileImage, deleteProfileImage, getUserTier } from '@/api/user'
import { checkNickname } from '@/api/auth'
import PixelText from '@/components/PixelText.vue'
import PixelButton from '@/components/PixelButton.vue'
import PixelInput from '@/components/PixelInput.vue'

const props = defineProps({
    user: Object
})
const emit = defineEmits(['refresh'])
const alertStore = useAlertStore() // Init

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
const selectedFile = ref(null)

// Tier Info
const userScore = ref(0)

const fetchTier = async () => {
    try {
        const res = await getUserTier()
        // API format: { message: "...", data: { userId: 1, score: 18 } }
        if (res.data) {
            userScore.value = res.data.score
        }
    } catch (e) {
        console.error("Failed to load tier", e)
    }
}

onMounted(() => {
    fetchTier()
})

const tierInfo = computed(() => {
    const s = userScore.value
    if (s >= 400) return { name: 'CHALLENGER', color: 'text-red-500', wing: 'wing-challenger', badge: '👑' }
    if (s >= 300) return { name: 'DIAMOND', color: 'text-cyan-400', wing: 'wing-diamond', badge: '💎' }
    if (s >= 200) return { name: 'GOLD', color: 'text-yellow-400', wing: 'wing-gold', badge: '🥇' }
    if (s >= 100) return { name: 'SILVER', color: 'text-gray-300', wing: 'wing-silver', badge: '🥈' }
    return { name: 'BRONZE', color: 'text-orange-700', wing: 'wing-bronze', badge: '🥉' }
})

// --- Profile Edit Logic ---
const openEditProfile = () => {
    editForm.value.nickname = props.user.nickname
    editForm.value.description = props.user.description || ''
    nicknameChecked.value = true
    nicknameError.value = ''
    showEditProfileModal.value = true
}

const handleCheckNickname = async () => {
    if (!editForm.value.nickname) return
    if (editForm.value.nickname === props.user.nickname) {
        nicknameChecked.value = true
        nicknameError.value = ''
        alertStore.showAlert('INFO', 'This is your current nickname.')
        return
    }

    try {
        await checkNickname(editForm.value.nickname)
        nicknameChecked.value = true
        nicknameError.value = ''
        alertStore.showAlert('SUCCESS', 'Nickname available!')
    } catch (e) {
        nicknameChecked.value = false
        nicknameError.value = 'Nickname already taken or invalid.'
        alertStore.showAlert('ERROR', 'Nickname duplicate!')
    }
}

const submitEditProfile = async () => {
    if (!nicknameChecked.value) {
        alertStore.showAlert('WARNING', 'Please check nickname first.')
        return
    }
    try {
        await updateUserProfile({
            nickname: editForm.value.nickname,
            description: editForm.value.description
        })
        await alertStore.showAlert('SUCCESS', 'Profile Updated!')
        showEditProfileModal.value = false
        emit('refresh')
    } catch (e) {
        console.error(e)
        alertStore.showAlert('ERROR', 'Update failed')
    }
}

// --- Image Edit Logic ---
const submitUpdateImage = async () => {
    if (!selectedFile.value) return
    try {
        await updateProfileImage(selectedFile.value)
        await alertStore.showAlert('SUCCESS', 'Image Updated!')
        showEditImageModal.value = false
        imageUrl.value = ''
        emit('refresh')
    } catch (e) {
        console.error(e)
        alertStore.showAlert('ERROR', 'Image update failed')
    }
}

const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
        imageUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
}

const handleDeleteImage = async () => {
    const result = await alertStore.showConfirm('DELETE', 'Remove profile image?')
    if (!result) return
    try {
        await deleteProfileImage()
        await alertStore.showAlert('SUCCESS', 'Image Removed')
        emit('refresh')
    } catch (e) {
        console.error(e)
        alertStore.showAlert('ERROR', 'Deletion failed')
    }
}
</script>

<template>
    <div
        class="h-full bg-[#1e1e1e]/90 border-2 border-green-500/50 p-6 pixel-window relative flex flex-col items-center text-center shadow-none overflow-hidden group/profile">

        <!-- Tier Background Glow -->
        <div class="absolute inset-0 z-0 opacity-10 transition-colors duration-500"
            :class="{ 'bg-red-500': tierInfo.name === 'CHALLENGER', 'bg-cyan-500': tierInfo.name === 'DIAMOND', 'bg-yellow-500': tierInfo.name === 'GOLD', 'bg-gray-400': tierInfo.name === 'SILVER', 'bg-orange-800': tierInfo.name === 'BRONZE' }">
        </div>

        <!-- Profile Image with Wings -->
        <div class="relative group cursor-pointer mb-6 mt-4 z-10" @click="showEditImageModal = true">
            <!-- Wings Container -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[100px] pointer-events-none z-[-1]"
                :class="tierInfo.wing"></div>

            <div
                class="w-24 h-24 rounded-full border-4 border-green-500 overflow-hidden bg-black/50 mx-auto shadow-[0_0_15px_rgba(74,222,128,0.3)] relative z-10 transition-transform group-hover:scale-105">
                <img :src="user?.profileImage || 'https://via.placeholder.com/150'" class="w-full h-full object-cover"
                    alt="Profile" />
            </div>
            <div
                class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-20">
                <span class="text-xs text-white pixel-font">CHANGE</span>
            </div>
        </div>

        <h2 class="text-2xl text-white font-bold mb-1 flex items-center justify-center gap-2">
            <span>{{ tierInfo.badge }}</span>
            <PixelText>{{ user?.nickname || 'UNKNOWN' }}</PixelText>
        </h2>

        <div class="flex flex-col gap-1 mb-4">
            <span class="text-xs text-gray-500">{{ user?.email || 'No Email' }}</span>
            <span class="text-[10px] font-bold tracking-widest" :class="tierInfo.color">{{ tierInfo.name }} ({{
                userScore }} pts)</span>
        </div>

        <div class="w-full h-px bg-gray-700 my-4"></div>

        <!-- NEW EDIT PROFILE BUTTON LOCATION -->
        <button @click="openEditProfile"
            class="mb-3 px-3 py-1 bg-green-500/20 border border-green-500 text-green-500 text-[10px] font-bold tracking-wider hover:bg-green-500 hover:text-black transition-all rounded shadow-[0_0_10px_rgba(34,197,94,0.3)] relative z-20">
            > EDIT IDENTITY
        </button>

        <p class="text-sm text-gray-300 italic leading-relaxed w-full break-words">
            "{{ user?.description || 'No description yet.' }}"
        </p>

        <!-- MODAL: EDIT PROFILE -->
        <Teleport to="body">
            <div v-if="showEditProfileModal"
                class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 text-left">
                <div
                    class="bg-[#1e1e1e] border-2 border-green-500 w-full max-w-md p-6 shadow-[0_0_30px_rgba(74,222,128,0.2)] relative rounded-xl">
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
                                <PixelButton variant="secondary" text="CHECK" @click="handleCheckNickname" />
                            </div>
                            <span v-if="nicknameError" class="text-[10px] text-red-500 mt-1">{{ nicknameError }}</span>
                            <span v-if="nicknameChecked && !nicknameError"
                                class="text-[10px] text-green-500 mt-1">Available!</span>
                        </div>

                        <div>
                            <label class="text-xs text-gray-500 mb-1 block">DESCRIPTION</label>
                            <textarea v-model="editForm.description" rows="3"
                                class="w-full bg-black border-2 border-gray-700 p-2 text-white text-sm outline-none focus:border-green-500 transition-colors placeholder:text-gray-700 rounded-lg"></textarea>
                        </div>

                        <div class="flex gap-3 mt-4">
                            <PixelButton variant="primary" class="flex-1" text="SAVE CHANGES"
                                @click="submitEditProfile" />
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- MODAL: EDIT IMAGE -->
        <Teleport to="body">
            <div v-if="showEditImageModal"
                class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 text-left">
                <div
                    class="bg-[#1e1e1e] border-2 border-blue-500 w-full max-w-md p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative rounded-xl">
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
                            class="border-2 border-dashed border-gray-600 bg-black/30 p-8 text-center cursor-pointer hover:border-blue-500 transition-colors relative rounded-lg">
                            <input type="file" accept="image/*" @change="handleFileChange"
                                class="absolute inset-0 opacity-0 cursor-pointer" />
                            <span class="text-sm text-blue-400" v-if="!imageUrl">Click to Upload File</span>
                            <span class="text-sm text-white" v-else>File Selected (Ready)</span>
                        </div>

                        <div class="flex gap-2 mt-4">
                            <PixelButton variant="danger" class="flex-1 !text-xs !h-10" text="RESET TO DEFAULT"
                                @click="handleDeleteImage" />
                            <PixelButton variant="primary" class="flex-[2] !text-xs !h-10" text="UPLOAD NEW"
                                @click="submitUpdateImage" />
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.pixel-window {
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
}

/* WING ANIMATIONS */
/* Common Wing Base using pseudo elements for symmetrical wings */
div[class*="wing-"]::before,
div[class*="wing-"]::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 60px;
    height: 100px;
    transform-origin: center;
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.8;
}

div[class*="wing-"]::before {
    left: -40px;
    transform: translateY(-50%) rotate(-15deg) scaleX(-1);
    background-image: var(--wing-image);
}

div[class*="wing-"]::after {
    right: -40px;
    transform: translateY(-50%) rotate(15deg);
    background-image: var(--wing-image);
}

/* Define Wing Styles via CSS Variables or Gradients if no images */
/* Using CSS Gradients to simulate wings for now since we lack assets */

.wing-bronze {
    --wing-color: #7c2d12;
}

.wing-bronze::before,
.wing-bronze::after {
    background: radial-gradient(circle at center, var(--wing-color) 0%, transparent 70%);
    clip-path: polygon(0 0, 100% 20%, 80% 100%, 0 80%);
}

.wing-silver {
    --wing-color: #e5e7eb;
}

.wing-silver::before,
.wing-silver::after {
    background: radial-gradient(circle at center, var(--wing-color) 0%, transparent 70%);
    clip-path: polygon(0 0, 100% 10%, 90% 100%, 10% 90%);
    filter: drop-shadow(0 0 5px white);
}

.wing-gold {
    --wing-color: #facc15;
}

.wing-gold::before,
.wing-gold::after {
    background: linear-gradient(45deg, var(--wing-color), transparent);
    clip-path: polygon(10% 0, 100% 0, 80% 100%, 0 80%);
    animation: wing-flap 3s infinite ease-in-out;
}

.wing-diamond {
    --wing-color: #22d3ee;
}

.wing-diamond::before,
.wing-diamond::after {
    background: linear-gradient(to bottom, var(--wing-color), #3b82f6);
    clip-path: polygon(0 0, 100% 0, 70% 100%, 30% 80%);
    filter: drop-shadow(0 0 10px #22d3ee);
    animation: wing-flap 2s infinite ease-in-out;
}

.wing-challenger {
    --wing-color: #ef4444;
}

.wing-challenger::before,
.wing-challenger::after {
    background: linear-gradient(135deg, #ef4444, #7f1d1d);
    clip-path: polygon(0 0, 100% 0, 60% 100%, 0 60%);
    filter: drop-shadow(0 0 15px red);
    animation: wing-flap 1s infinite alternate;
}

@keyframes wing-flap {
    0% {
        transform: translateY(-50%) rotate(15deg) scaleX(1);
    }

    50% {
        transform: translateY(-55%) rotate(20deg) scaleX(1.1);
    }

    100% {
        transform: translateY(-50%) rotate(15deg) scaleX(1);
    }
}

/* Adjust left wing animation mirror */
.wing-gold::before,
.wing-diamond::before,
.wing-challenger::before {
    animation-name: wing-flap-left;
}

@keyframes wing-flap-left {
    0% {
        transform: translateY(-50%) rotate(-15deg) scaleX(-1);
    }

    50% {
        transform: translateY(-55%) rotate(-20deg) scaleX(-1.1);
    }

    100% {
        transform: translateY(-50%) rotate(-15deg) scaleX(-1);
    }
}
</style>
