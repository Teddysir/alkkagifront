<script setup>
import { ref } from 'vue'
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
const isLoading = ref(false)
const errorMessage = ref('')

const handleCheckEmail = async () => {
  if (!email.value) return
  try {
    const res = await checkEmail(email.value)
    if (res.data && res.data.isAvailable) {
        isEmailChecked.value = true
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
  if (!email.value || !nickname.value || !password.value || !confirmPassword.value) {
    errorMessage.value = '모든 필드를 입력해주세요.'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  // Optional: Enforce duplicate checks before submit
  // if (!isEmailChecked.value || !isNicknameChecked.value) {
  //   errorMessage.value = '중복 확인을 완료해주세요.'
  //   return
  // }

  isLoading.value = true
  errorMessage.value = ''

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
      <div class="flex gap-2">
        <PixelInput v-model="email" placeholder="example@email.com" class="flex-1" />
        <button 
          @click="handleCheckEmail"
          class="px-3 bg-zinc-800 text-gray-300 font-mono text-xs border border-gray-600 hover:bg-zinc-700 transition-colors pixel-btn"
        >
          CHECK
        </button>
      </div>
    </div>

    <!-- Nickname -->
    <div class="flex flex-col gap-2">
      <label class="text-gray-400 font-mono text-sm tracking-wider">NICKNAME</label>
      <div class="flex gap-2">
        <PixelInput v-model="nickname" placeholder="Player1" class="flex-1" />
        <button 
          @click="handleCheckNickname"
          class="px-3 bg-zinc-800 text-gray-300 font-mono text-xs border border-gray-600 hover:bg-zinc-700 transition-colors pixel-btn"
        >
          CHECK
        </button>
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

    <PixelButton 
      text="JOIN THE GAME" 
      :disabled="isLoading" 
      @click="handleSignup"
      class="mt-2"
    />
  </div>
</template>
