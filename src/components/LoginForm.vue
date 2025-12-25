<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PixelInput from '@/components/PixelInput.vue'
import PixelButton from '@/components/PixelButton.vue'
import PixelText from '@/components/PixelText.vue'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alert'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const router = useRouter()
const authStore = useAuthStore()
const alertStore = useAlertStore()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    await alertStore.showAlert('MISSING INPUT', '이메일과 비밀번호를 입력해주세요.')
    return
  }

  isLoading.value = true

  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      router.push('/')
    }
  } catch (error) {
    console.error(error)
    await alertStore.showAlert('LOGIN FAILED', '로그인에 실패했습니다. \n이메일과 비밀번호를 확인해주세요.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-6 w-full max-w-md p-6 bg-[#0a0a0a]/80 border border-green-500/30 rounded-2xl shadow-xl backdrop-blur-sm">
    <!-- Header -->
    <div class="text-center mb-2">
      <h2 class="text-2xl font-bold text-white tracking-widest">
        <PixelText>WELCOME BACK</PixelText>
      </h2>
      <p class="text-xs text-gray-500 mt-1">
        <PixelText>LOG IN TO CONTINUE</PixelText>
      </p>
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-green-400 font-bold text-xs tracking-wider">
          <PixelText>EMAIL</PixelText>
        </label>
        <PixelInput v-model="email" placeholder="example@email.com" class="!rounded-lg" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-green-400 font-bold text-xs tracking-wider">
          <PixelText>PASSWORD</PixelText>
        </label>
        <PixelInput v-model="password" type="password" placeholder="********" class="!rounded-lg" />
      </div>
    </div>

    <button @click="handleLogin" :disabled="isLoading"
      class="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-sm tracking-widest rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center">
      <PixelText>LET'S GO!</PixelText>
    </button>
  </div>
</template>
