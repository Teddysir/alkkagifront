<script setup>
import { ref } from 'vue'
import LoginForm from '@/components/LoginForm.vue'
import SignupForm from '@/components/SignupForm.vue'
import { RouterLink } from 'vue-router'

const activeTab = ref('login') // 'login' or 'signup'

const setTab = (tab) => {
  activeTab.value = tab
}

const handleSignupSuccess = () => {
  setTab('login')
}
</script>

<template>
  <div class="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center font-mono relative overflow-hidden">
    
    <!-- Header -->
    <nav class="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
      <RouterLink to="/" class="text-white text-3xl font-bold tracking-wider pixel-font hover:text-green-400 cursor-pointer transition-colors no-underline">
        Alkkagi
      </RouterLink>
    </nav>

    <!-- Main Content Box -->
    <div class="z-10 w-full max-w-lg px-4">
      <div class="pixel-box p-8 flex flex-col items-center">
        
        <!-- Tabs -->
        <div class="flex w-full mb-8 border-b-2 border-zinc-700">
          <button 
            @click="setTab('login')"
            class="flex-1 pb-4 text-center transition-colors relative"
            :class="activeTab === 'login' ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
          >
            <span class="tracking-widest text-lg font-bold">LOGIN</span>
            <div v-if="activeTab === 'login'" class="absolute bottom-[-2px] left-0 w-full h-[4px] bg-green-500"></div>
          </button>
          
          <button 
            @click="setTab('signup')"
            class="flex-1 pb-4 text-center transition-colors relative"
            :class="activeTab === 'signup' ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
          >
            <span class="tracking-widest text-lg font-bold">SIGN UP</span>
            <div v-if="activeTab === 'signup'" class="absolute bottom-[-2px] left-0 w-full h-[4px] bg-red-500"></div>
          </button>
        </div>

        <!-- Render active form -->
        <transition name="fade" mode="out-in">
          <LoginForm v-if="activeTab === 'login'" />
          <SignupForm v-else @success="handleSignupSuccess" />
        </transition>

      </div>
    </div>

    <!-- Snow Background (Optional, reused from Landing if desired, but kept simple here) -->
    
  </div>
</template>

<style scoped>
/* Inherits global styles */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
