<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import PixelInput from '@/components/PixelInput.vue'
import PixelButton from '@/components/PixelButton.vue'
import PixelText from '@/components/PixelText.vue'
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

const passwordError = computed(() => {
  if (!password.value) return ''
  if (password.value.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
  // Optional: Add more complex regex if needed, e.g. /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  return ''
})

const passwordMatchError = computed(() => {
  if (!confirmPassword.value) return ''
  if (password.value !== confirmPassword.value) return '비밀번호가 일치하지 않습니다.'
  return ''
})

const handleSendVerification = async () => {
  if (!email.value) {
    await alertStore.showAlert('MISSING INPUT', '이메일을 입력해주세요.')
    return
  }

  // Email Format Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    await alertStore.showAlert('INVALID EMAIL', '올바른 이메일 형식이 아닙니다.')
    return
  }

  // Optimistic Update
  isVerificationSent.value = true
  startTimer()

  // Show Succcess Alert Immediately
  alertStore.showAlert('SUCCESS', '인증번호가 전송되었습니다. \n이메일을 확인해주세요!')

  // Background Request
  isLoading.value = true
  sendVerificationEmail(email.value)
    .catch(e => {
      console.error(e)
      // Failure: Revert state
      isVerificationSent.value = false
      if (timerInterval) clearInterval(timerInterval)
      timer.value = 0
      alertStore.showAlert('ERROR', '인증번호 전송 실패. \n이메일을 확인해주세요.')
    })
    .finally(() => {
      isLoading.value = false
    })
}

const handleCheckNickname = async () => {
  // ... existing code ...
  if (!nickname.value) return
  // ...
  // Using existing logic but ensuring no regression
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
  // 1. Validate Inputs
  if (!email.value || !nickname.value || !password.value || !confirmPassword.value) {
    await alertStore.showAlert('MISSING INPUT', '모든 필드를 입력해주세요.')
    return
  }

  // 2. Validate Password Match
  if (password.value !== confirmPassword.value) {
    await alertStore.showAlert('INVALID PASSWORD', '비밀번호가 일치하지 않습니다.')
    return
  }

  // 3. Validate Nickname Check
  // if (!isNicknameChecked.value) {
  //   await alertStore.showAlert('CHECK NICKNAME', '닉네임 중복 확인을 해주세요.')
  //   return
  // }
  // Commented out to allow testing without strict check if backend handles it, 
  // but logically better to enforce. Un-commenting for robustness:
  if (!isNicknameChecked.value) {
    await alertStore.showAlert('CHECK NICKNAME', '닉네임 중복 확인을 해주세요.')
    return
  }


  // 4. Validate Email Verification (Optional depending on flow, but strict here)
  if (!isVerificationSent) {
    await alertStore.showAlert('VERIFY EMAIL', '이메일 인증을 진행해주세요.')
    return
  }
  // If verifying code is required:
  if (!verificationCode.value) {
    await alertStore.showAlert('VERIFY EMAIL', '인증 코드를 입력해주세요.')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const payload = {
      email: email.value,
      nickname: nickname.value,
      password: password.value,
      authCode: verificationCode.value // Sending auth code to backend
    }

    // Call API
    await signup(payload)

    // Success
    await alertStore.showAlert('WELCOME', '회원가입이 완료되었습니다!')
    emit('success')

  } catch (e) {
    console.error(e)
    // Handle specific errors if backend sends them (e.g. 409 conflict, 400 bad request)
    const msg = e.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
    errorMessage.value = msg
    await alertStore.showAlert('ERROR', msg)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-6 w-full max-w-md p-6 bg-[#0a0a0a]/80 border border-green-500/30 rounded-2xl shadow-xl backdrop-blur-sm">
    <!-- ... Header & Email ... -->
    <div class="text-center mb-2">
      <h2 class="text-2xl font-bold text-white tracking-widest">
        <PixelText>JOIN THE ALKKAGI</PixelText>
      </h2>
      <p class="text-xs text-gray-500 mt-1">
        <PixelText>CREATE YOUR ACCOUNT</PixelText>
      </p>
    </div>

    <form @submit.prevent="handleSignup" class="flex flex-col gap-6 w-full">
      <!-- Email & Verification -->
      <div class="flex flex-col gap-2">
        <label class="text-green-400 font-bold text-xs tracking-wider">
          <PixelText>EMAIL</PixelText>
        </label>
        <div class="flex gap-2 items-start relative">
          <div class="flex-1">
            <PixelInput v-model="email" placeholder="example@email.com" class="w-full !rounded-lg"
              :disabled="isVerificationSent && timer > 0" />
          </div>
          <button @click.prevent="handleSendVerification" :disabled="isLoading || (isVerificationSent && timer > 0)"
            class="h-10 px-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-lg flex items-center justify-center whitespace-nowrap">
            <PixelText>{{ isVerificationSent ? 'RESEND' : 'VERIFY' }}</PixelText>
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
        <label class="text-green-400 font-bold text-xs tracking-wider">
          <PixelText>NICKNAME</PixelText>
        </label>
        <div class="flex gap-2 items-start">
          <PixelInput v-model="nickname" placeholder="Nickname" class="flex-1 !rounded-lg" />
          <button @click.prevent="handleCheckNickname"
            class="h-10 px-4 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg border border-gray-600 flex items-center justify-center">
            <PixelText>CHECK</PixelText>
          </button>
        </div>
        <div v-if="nicknameWarning" class="text-red-400 font-mono text-xs text-right">
          {{ nicknameWarning }}
        </div>
      </div>

      <!-- Password -->
      <div class="flex flex-col gap-2">
        <label class="text-green-400 font-bold text-xs tracking-wider">
          <PixelText>PASSWORD</PixelText>
        </label>
        <PixelInput v-model="password" type="password" placeholder="********" class="!rounded-lg" />
        <div v-if="passwordError" class="text-red-400 font-mono text-[10px] text-right">
          {{ passwordError }}
        </div>
        <div v-else-if="password.length >= 8" class="text-green-400 font-mono text-[10px] text-right">
          사용 가능한 비밀번호입니다.
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="flex flex-col gap-2">
        <label class="text-green-400 font-bold text-xs tracking-wider">
          <PixelText>CONFIRM PASSWORD</PixelText>
        </label>
        <PixelInput v-model="confirmPassword" type="password" placeholder="********" class="!rounded-lg" />

        <div v-if="passwordMatchError" class="text-red-400 font-mono text-[10px] text-right">
          {{ passwordMatchError }}
        </div>

        <div v-else-if="confirmPassword && !passwordMatchError" class="text-green-400 font-mono text-[10px] text-right">
          비밀번호가 일치합니다.
        </div>
      </div>

      <div v-if="errorMessage"
        class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center font-bold">
        ! {{ errorMessage }}
      </div>

      <button type="submit" :disabled="isLoading"
        class="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-sm tracking-widest rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center">
        <PixelText>INITIALIZE ID</PixelText>
      </button>
    </form>
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
