<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import PixelInput from '@/components/PixelInput.vue'
import PixelButton from '@/components/PixelButton.vue'
import { signup, checkNickname, sendVerificationEmail } from '@/api/auth'
import { useAlertStore } from '@/stores/alert'

const emit = defineEmits(['success'])

const email = ref('')
const verificationCode = ref('') // Auth Code
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')

const isEmailVerified = ref(false) // Actually, we assume sent = step 1. Real verification happens on signup or separate step? 
// User didn't give verify endpoint. We'll set this true if code is entered? 
// Or just track if SENT.
const isVerificationSent = ref(false)
const timer = ref(300) // 5 minutes (300s)
let timerInterval = null

const isNicknameChecked = ref(false)
const nicknameWarning = ref('')

const isLoading = ref(false)
const errorMessage = ref('')

const alertStore = useAlertStore()

watch(nickname, () => {
  isNicknameChecked.value = false
  nicknameWarning.value = ''
})

const formattedTimer = computed(() => {
  const m = Math.floor(timer.value / 60)
  const s = timer.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timer.value = 300
  timerInterval = setInterval(() => {
    timer.value--
    if (timer.value <= 0) {
      clearInterval(timerInterval)
      timerInterval = null
      // Handle expiration?
    }
  }, 1000)
}

const handleSendVerification = async () => {
  if (!email.value) return
  try {
    isLoading.value = true
    await sendVerificationEmail(email.value)
    await alertStore.showAlert('SUCCESS', '인증번호가 전송되었습니다. 이메일을 확인해주세요!')
    isVerificationSent.value = true
    startTimer()
  } catch (e) {
    console.error(e)
    // Handle error (e.g. duplicate email handled by backend 409?)
    await alertStore.showAlert('ERROR', '인증번호 전송 실패. 이메일을 확인해주세요.')
  } finally {
    isLoading.value = false
  }
}

const handleCheckNickname = async () => {
  if (!nickname.value) return
  try {
    const res = await checkNickname(nickname.value)
    if (res.data && res.data.isAvailable) {
      isNicknameChecked.value = true
      nicknameWarning.value = ''
      await alertStore.showAlert('CHECK SUCCESS', '사용 가능한 닉네임입니다.')
    } else {
      await alertStore.showAlert('CHECK FAIL', '이미 사용중인 닉네임입니다.')
      isNicknameChecked.value = false
    }
  } catch (e) {
    console.error(e)
    await alertStore.showAlert('ERROR', '확인 중 오류가 발생했습니다.')
    isNicknameChecked.value = false
  }
}

const handleSignup = async () => {
  errorMessage.value = ''

  if (!email.value || !nickname.value || !password.value || !confirmPassword.value || !verificationCode.value) {
    errorMessage.value = '모든 필드를 입력해주세요.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  if (!isVerificationSent.value) {
    errorMessage.value = '이메일 인증을 진행해주세요.'
    return
  }

  if (!isNicknameChecked.value) {
    errorMessage.value = '닉네임 중복체크를 먼저 확인해주세요!'
    return
  }

  isLoading.value = true

  try {
    // Assuming signup takes the code, given we have no verify endpoint
    await signup({
      email: email.value,
      nickname: nickname.value,
      password: password.value,
      verificationCode: verificationCode.value // Send code with signup
    })
    await alertStore.showAlert('SIGNUP SUCCESS', '회원가입 성공! 로그인해주세요.')
    emit('success')
  } catch (error) {
    console.error(error)
    errorMessage.value = '회원가입에 실패했습니다. (인증번호 혹은 중복 확인)'
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div
    class="flex flex-col gap-6 w-full max-w-md p-6 bg-[#0a0a0a]/80 border border-green-500/30 rounded-2xl shadow-xl backdrop-blur-sm">
    <!-- Header -->
    <div class="text-center mb-2">
      <h2 class="text-2xl font-bold text-white tracking-widest">JOIN THE SQUAD</h2>
      <p class="text-xs text-gray-500 mt-1">CREATE YOUR ACCOUNT</p>
    </div>

    <!-- Email & Verification -->
    <div class="flex flex-col gap-2">
      <label class="text-green-400 font-bold text-xs tracking-wider">EMAIL</label>
      <div class="flex gap-2 items-start relative">
        <div class="flex-1">
          <PixelInput v-model="email" placeholder="example@email.com" class="w-full !rounded-lg"
            :disabled="isVerificationSent && timer > 0" />
        </div>
        <button @click="handleSendVerification" :disabled="isLoading || (isVerificationSent && timer > 0)"
          class="h-10 px-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-lg flex items-center justify-center whitespace-nowrap">
          {{ isVerificationSent ? 'RESEND' : 'VERIFY' }}
        </button>
      </div>

      <!-- Verification Code Input (Shown after send) -->
      <transition name="slide-fade">
        <div v-if="isVerificationSent" class="flex gap-2 items-center mt-2 animate-slide-in">
          <div class="relative flex-1">
            <PixelInput v-model="verificationCode" placeholder="ENTER CODE"
              class="w-full !rounded-lg !border-green-500/50" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs font-mono font-bold">{{
              formattedTimer }}</span>
          </div>
        </div>
      </transition>
    </div>

    <!-- Nickname -->
    <div class="flex flex-col gap-2">
      <label class="text-green-400 font-bold text-xs tracking-wider">NICKNAME</label>
      <div class="flex gap-2 items-start">
        <PixelInput v-model="nickname" placeholder="Player1" class="flex-1 !rounded-lg" />
        <button @click="handleCheckNickname"
          class="h-10 px-4 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg border border-gray-600">
          CHECK
        </button>
      </div>
      <div v-if="nicknameWarning" class="text-red-400 font-mono text-xs text-right">
        {{ nicknameWarning }}
      </div>
    </div>

    <!-- Password -->
    <div class="flex flex-col gap-2">
      <label class="text-green-400 font-bold text-xs tracking-wider">PASSWORD</label>
      <PixelInput v-model="password" type="password" placeholder="********" class="!rounded-lg" />
    </div>

    <!-- Confirm Password -->
    <div class="flex flex-col gap-2">
      <label class="text-green-400 font-bold text-xs tracking-wider">CONFIRM PASSWORD</label>
      <PixelInput v-model="confirmPassword" type="password" placeholder="********" class="!rounded-lg" />
    </div>

    <div v-if="errorMessage"
      class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center font-bold">
      ! {{ errorMessage }}
    </div>

    <button @click="handleSignup" :disabled="isLoading"
      class="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-sm tracking-widest rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
      INITIALIZE ID
    </button>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
