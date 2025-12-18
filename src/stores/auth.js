import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const isAuthenticated = computed(() => !!user.value)

    const login = async (email, password) => {
        try {
            const response = await loginApi(email, password)

            // Token handling
            const token = response.headers['authorization']
            if (token) {
                const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token
                localStorage.setItem('Authorization', cleanToken)
            }

            // User data handling from response body
            // Response structure: { message, data: { ...user info... } }
            if (response.data && response.data.data) {
                user.value = response.data.data
                localStorage.setItem('user', JSON.stringify(user.value))
            }

            return true
        } catch (error) {
            console.error('Login failed in store:', error)
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('Authorization')
        localStorage.removeItem('user')
        user.value = null
    }

    return {
        user,
        isAuthenticated,
        login,
        logout
    }
})
