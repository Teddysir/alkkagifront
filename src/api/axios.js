import axios from 'axios'

const instance = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
})

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('Authorization')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// 토큰 디코딩 함수 (수정됨)
export const decodeToken = (token) => {
    if (!token) return null
    try {
        // Bearer 접두사가 포함된 경우 제거
        const base64Url = token.includes(' ') ? token.split(' ')[1].split('.')[1] : token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')))
    } catch (e) {
        console.error('Decoding error:', e)
        return null
    }
}

export const checkIsAdmin = (token) => {
    const payload = decodeToken(token)
    return payload?.role === 'ROLE_ADMIN'
}

instance.interceptors.response.use(
    (response) => {
        const newAccessToken = response.headers['authorization']
        if (newAccessToken) {
            const cleanToken = newAccessToken.startsWith('Bearer ') ? newAccessToken.split(' ')[1] : newAccessToken

            localStorage.setItem('Authorization', cleanToken)

        }
        return response
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Login 또는 Signup 실패 시 401이 오더라도 리다이렉트 하지 않음
            if (error.config.url.includes('/login') || error.config.url.includes('/users/signup')) {
                return Promise.reject(error)
            }
            localStorage.removeItem('Authorization')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default instance