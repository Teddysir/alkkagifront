<script setup>
import { ref, watch } from 'vue'
import PixelInput from '@/components/PixelInput.vue'
import PixelButton from '@/components/PixelButton.vue'
import { signup, checkEmail, checkNickname } from '@/api/auth'

const emit = defineEmits(['success'])

const email = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')

const isEmailChecked = ref(false)
const isNicknameChecked = ref(false)
const emailWarning = ref('')
const nicknameWarning = ref('')

const isLoading = ref(false)
const errorMessage = ref('')

// Reset checks when input changes
watch(email, () => {
  isEmailChecked.value = false
  emailWarning.value = ''
})
watch(nickname, () => {
  isNicknameChecked.value = false
  nicknameWarning.value = ''
})

const handleCheckEmail = async () => {
  if (!email.value) return
  /* User requested warning if button not clicked, but if clicked and failed, we show alert. 
     We should clear warning if check passes. */
  try {
    const res = await checkEmail(email.value)
    if (res.data && res.data.isAvailable) {
      isEmailChecked.value = true
      emailWarning.value = '' // Clear warning
      alert('사용 가능한 이메일입니다.')
    } else {
      alert('이미 사용중인 이메일입니다.')
      isEmailChecked.value = false
    }
  } catch (e) {
    console.error(e)
    alert('확인 중 오류가 발생했습니다.')
    isEmailChecked.value = false
  }
}

const handleCheckNickname = async () => {
  if (!nickname.value) return
  try {
    const res = await checkNickname(nickname.value)
    if (res.data && res.data.isAvailable) {
      isNicknameChecked.value = true
      nicknameWarning.value = '' // Clear warning
      alert('사용 가능한 닉네임입니다.')
    } else {
      alert('이미 사용중인 닉네임입니다.')
      isNicknameChecked.value = false
    }
  } catch (e) {
    console.error(e)
    alert('확인 중 오류가 발생했습니다.')
    isNicknameChecked.value = false
  }
}

const handleSignup = async () => {
  emailWarning.value = ''
  nicknameWarning.value = ''
  errorMessage.value = ''

  let hasError = false

  if (!email.value || !nickname.value || !password.value || !confirmPassword.value) {
    errorMessage.value = '모든 필드를 입력해주세요.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  // Validate Duplicate Checks
  if (!isEmailChecked.value) {
    emailWarning.value = '중복체크를 먼저 확인해주세요 용사님!'
    hasError = true
  }
  if (!isNicknameChecked.value) {
    nicknameWarning.value = '중복체크를 먼저 확인해주세요 용사님!'
    hasError = true
  }

  if (hasError) return

  isLoading.value = true

  try {
    await signup({
      email: email.value,
      nickname: nickname.value,
      password: password.value
    })
    alert('용사로 전직 성공! 로그인해주세요.')
    emit('success')
  } catch (error) {
    console.error(error)
    errorMessage.value = '회원가입에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 w-full max-w-md">
    <!-- Email -->
    <div class="flex flex-col gap-2">
      <label class="text-gray-400 font-mono text-sm tracking-wider">EMAIL</label>
      <div class="flex gap-2 items-start">
        <PixelInput v-model="email" placeholder="example@email.com" class="flex-1" />
        <div class="flex flex-col items-center">
          <button @click="handleCheckEmail"
            class="h-14 px-3 bg-zinc-800 text-gray-300 font-mono text-xs border border-gray-600 hover:bg-zinc-700 transition-colors pixel-btn whitespace-nowrap">
            CHECK
          </button>
        </div>
      </div>
      <div v-if="emailWarning" class="text-red-400 font-mono text-xs animate-pulse text-right">
        {{ emailWarning }}
      </div>
    </div>

    <!-- Nickname -->
    <div class="flex flex-col gap-2">
      <label class="text-gray-400 font-mono text-sm tracking-wider">NICKNAME</label>
      <div class="flex gap-2 items-start">
        <PixelInput v-model="nickname" placeholder="Player1" class="flex-1" />
        <div class="flex flex-col items-center">
          <button @click="handleCheckNickname"
            class="h-14 px-3 bg-zinc-800 text-gray-300 font-mono text-xs border border-gray-600 hover:bg-zinc-700 transition-colors pixel-btn whitespace-nowrap">
            CHECK
          </button>
        </div>
      </div>
      <div v-if="nicknameWarning" class="text-red-400 font-mono text-xs animate-pulse text-right">
        {{ nicknameWarning }}
      </div>
    </div>

    <!-- Password -->
    <div class="flex flex-col gap-2">
      <label class="text-gray-400 font-mono text-sm tracking-wider">PASSWORD</label>
      <PixelInput v-model="password" type="password" placeholder="********" />
    </div>

    <!-- Confirm Password -->
    <div class="flex flex-col gap-2">
      <label class="text-gray-400 font-mono text-sm tracking-wider">CONFIRM PASSWORD</label>
      <PixelInput v-model="confirmPassword" type="password" placeholder="********" />
    </div>

    <div v-if="errorMessage" class="text-red-400 font-mono text-sm text-center animate-pulse">
      ! {{ errorMessage }}
    </div>

    <PixelButton text="JOIN THE GAME" :disabled="isLoading" @click="handleSignup" class="mt-2" />
  </div>
</template>
