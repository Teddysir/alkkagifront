// stores.js
import { defineStore } from 'pinia'
import { checkIsAdmin } from '@/api/axios'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('Authorization') || null,
    }),
    getters: {
        // state를 인자로 받아 token이 바뀔 때마다 다시 계산됨
        isAdmin: (state) => {
            if (!state.token) return false;
            const result = checkIsAdmin(state.token);
            return result;
        }
    },
    actions: {
        setAuth(token, userData) {
            this.token = token
            this.user = userData
            localStorage.setItem('Authorization', token)
            localStorage.setItem('user', JSON.stringify(userData))
        },
        logout() {
            this.user = null
            this.token = null
            localStorage.removeItem('user')
            localStorage.removeItem('Authorization')
        }
    }
})