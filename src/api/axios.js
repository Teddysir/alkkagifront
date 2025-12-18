import axios from 'axios'

const instance = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor for global error handling (optional expansion point)
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error)
    }
)

export default instance
