import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth' // authStore 가져오기
import { getNotificationList, getUnreadCount, markAsRead, deleteNotifications } from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
    const authStore = useAuthStore()
    const notifications = ref([])
    const unreadCount = ref(0)
    const isConnected = ref(false)
    let abortController = null

    // --- API Interactions ---
    const fetchNotifications = async () => {
        try {
            const res = await getNotificationList()
            notifications.value = res.data || []
        } catch (e) { console.error("Failed to fetch notifications", e) }
    }

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadCount()
            unreadCount.value = res.data?.notificationCount || 0
        } catch (e) { console.error("Failed to fetch count", e) }
    }

    // ... markRead, removeNotification 등 기존 액션 유지 ...

    // --- SSE Logic ---
    const connectSSE = async () => {
        if (isConnected.value || abortController) return

        const currentToken = authStore.token
        if (!currentToken) return

        const url = `${import.meta.env.VITE_API_BASE_URL || 'https://alkkagiback.shop'}/api/v1/notifications/subscribe`
        abortController = new AbortController()

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                },
                signal: abortController.signal
            })

            // 1. 응답 헤더에서 새 토큰 확인 (RT로 재발급된 경우)
            const newTokenHeader = response.headers.get('Authorization')
            if (newTokenHeader) {
                const cleanToken = newTokenHeader.startsWith('Bearer ') ? newTokenHeader.split(' ')[1] : newTokenHeader
                authStore.token = cleanToken // authStore 상태 갱신
                localStorage.setItem('Authorization', cleanToken) // 로컬 스토리지 동기화
                console.log("SSE: Access Token updated via Response Header")
            }

            if (response.status === 401) {
                console.error("SSE: Unauthorized. Connection failed.")
                isConnected.value = false
                return
            }

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)

            isConnected.value = true
            console.log("SSE Stream Connected Successfully")

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const parts = buffer.split('\n\n')
                buffer = parts.pop()

                for (const part of parts) {
                    if (part.trim()) processMessage(part)
                }
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                console.log("SSE: Connection Aborted")
            } else {
                console.error("SSE: Error occurred", e)
                isConnected.value = false
                abortController = null
                setTimeout(() => connectSSE(), 5000) // 재연결 시도
            }
        } finally {
            isConnected.value = false
            abortController = null
        }
    }

    const processMessage = (part) => {
        const lines = part.split('\n')
        let eventType = 'message', data = ''
        lines.forEach(line => {
            if (line.startsWith('event:')) eventType = line.substring(6).trim()
            else if (line.startsWith('data:')) data = line.substring(5).trim()
        })

        if (eventType === 'INIT') fetchUnreadCount()
        else if (eventType === 'NOTIFICATION') {
            fetchNotifications()
            fetchUnreadCount()
        }
    }

    const disconnectSSE = () => {
        if (abortController) {
            abortController.abort()
            abortController = null
        }
        isConnected.value = false
    }

    return { notifications, unreadCount, isConnected, fetchNotifications, fetchUnreadCount, connectSSE, disconnectSSE }
})