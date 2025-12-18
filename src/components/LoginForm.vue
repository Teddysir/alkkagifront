<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PixelInput from '@/components/PixelInput.vue'
import PixelButton from '@/components/PixelButton.vue'
import { login } from '@/api/auth'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = '이메일과 비밀번호를 입력해주세요.'
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await login(email.value, password.value);
    
    // HTTP 응답 헤더에서 토큰 추출
    const token = response.headers['authorization']; 
    
    if (token) {
      // 만약 토큰에 "Bearer " 접두사가 붙어있다면 제거하고 저장하는 것이 좋습니다.
      const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      
      localStorage.setItem('Authorization', cleanToken); // 키 이름 대소문자 주의!
      router.push('/');
    } else {
      errorMessage.value = '헤더에서 토큰을 찾을 수 없습니다.';
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-md">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-gray-400 font-mono text-sm tracking-wider">EMAIL</label>
        <PixelInput v-model="email" placeholder="example@email.com" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-gray-400 font-mono text-sm tracking-wider">PASSWORD</label>
        <PixelInput v-model="password" type="password" placeholder="********" />
      </div>
    </div>

    <div v-if="errorMessage" class="text-red-400 font-mono text-sm text-center animate-pulse">
      ! {{ errorMessage }}
    </div>

    <PixelButton 
      text="GAME START" 
      :disabled="isLoading" 
      @click="handleLogin"
      class="mt-4"
    />
  </div>
</template>
