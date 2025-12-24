import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { checkIsAdmin } from '@/api/axios' // axios.js에서 만든 함수 가져오기

export const useAuthStore = defineStore('auth', () => {
    // 1. 상태(State) 관리
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    // token도 ref로 만들어야 isAdmin이 실시간으로 반응합니다.
    const token = ref(localStorage.getItem('Authorization') || null)

    // 2. Getter (Computed)
    const isAuthenticated = computed(() => !!user.value)

    // [추가] 어드민 여부 계산
    const isAdmin = computed(() => {
        if (!token.value) return false
        return checkIsAdmin(token.value)
    })

    // 3. Actions
    const login = async (email, password) => {
        try {
            const response = await loginApi(email, password)

            // Token handling
            const rawToken = response.headers['authorization']
            if (rawToken) {
                const cleanToken = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken
                localStorage.setItem('Authorization', cleanToken)
                token.value = cleanToken
            }

            // User data handling
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

    const logout = async () => {
        try {
            await logoutApi()
        } catch (error) {
            console.error('Logout API failed:', error)
        } finally {
            localStorage.removeItem('Authorization')
            localStorage.removeItem('user')

            user.value = null
            token.value = null
        }
    }

    // 반드시 모든 변수와 함수를 return해야 외부(Header 등)에서 쓸 수 있습니다.
    return {
        user,
        token,
        isAdmin,
        isAuthenticated,
        login,
        logout
    }
})