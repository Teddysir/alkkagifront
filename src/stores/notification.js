import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNotificationList, getUnreadCount, markAsRead, deleteNotifications } from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref([])
    const unreadCount = ref(0)
    const isConnected = ref(false)
    let eventSource = null

    // --- API Interactions ---
    const fetchNotifications = async () => {
        try {
            const res = await getNotificationList()
            // Format: { message: "...", data: [...] }
            notifications.value = res.data || []
        } catch (e) {
            console.error("Failed to fetch notifications", e)
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadCount()
            // Format: { message: "...", data: { notificationCount: 4 } }
            unreadCount.value = res.data?.notificationCount || 0
        } catch (e) {
            console.error("Failed to fetch count", e)
        }
    }

    const markRead = async (id) => {
        try {
            // Optimistic update
            const target = notifications.value.find(n => n.id === id)
            if (target && !target.isRead) {
                target.isRead = true
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }

            await markAsRead(id)
        } catch (e) {
            console.error("Failed to mark read", e)
            fetchNotifications() // Revert on fail
            fetchUnreadCount()
        }
    }

    const removeNotification = async (id) => {
        try {
            // Optimistic update
            const target = notifications.value.find(n => n.id === id)
            if (target && !target.isRead) {
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
            notifications.value = notifications.value.filter(n => n.id !== id)

            await deleteNotifications([id])
        } catch (e) {
            console.error("Failed to delete", e)
            fetchNotifications()
        }
    }

    const removeAllNotifications = async (ids) => {
        try {
            notifications.value = notifications.value.filter(n => !ids.includes(n.id))
            unreadCount.value = 0 // Assuming all deleted
            await deleteNotifications(ids)
        } catch (e) {
            console.error("Failed to delete all", e)
            fetchNotifications()
        }
    }

    // --- SSE Logic (Fetch Implementation for Auth Headers) ---
    let abortController = null

    const connectSSE = async () => {
        if (isConnected.value || abortController) return

        const token = localStorage.getItem('Authorization')
        if (!token) {
            console.warn("SSE: No token found, skipping connection.")
            return
        }

        const url = `${import.meta.env.VITE_API_BASE_URL || 'https://alkkagiback.shop'}/api/v1/notifications/subscribe`
        console.log("Connecting SSE (Fetch) to:", url)

        abortController = new AbortController()

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                },
                signal: abortController.signal
            })

            if (!response.ok) {
                throw new Error(`SSE HTTP Error: ${response.status}`)
            }

            console.log("SSE Connected! Reading stream...")
            isConnected.value = true

            // Start reading the stream
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            // Infinite loop to read stream
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                // Process complete blocks separated by double newline
                const parts = buffer.split('\n\n')
                buffer = parts.pop() // Keep incomplete part for next chunk

                for (const part of parts) {
                    if (!part.trim()) continue

                    const lines = part.split('\n')
                    let eventType = 'message'
                    let data = ''

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventType = line.substring(6).trim()
                        } else if (line.startsWith('data:')) {
                            data = line.substring(5).trim()
                        }
                    }

                    // Handle Events
                    if (eventType === 'INIT') {
                        console.log("SSE: Init Event Received")
                        fetchUnreadCount() // Sync initial count
                    } else if (eventType === 'NOTIFICATION') {
                        console.log("SSE: Notification Received", data)
                        try {
                            const parsedData = (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) ? JSON.parse(data) : data
                            console.log("SSE Payload:", parsedData)
                            fetchNotifications()
                            fetchUnreadCount()
                        } catch (e) {
                            console.error("SSE Parse Error:", e, data)
                        }
                    }
                }
            }

        } catch (e) {
            if (e.name === 'AbortError') {
                console.log("SSE Connection Aborted (User Disconnect)")
            } else {
                console.error("SSE Connection Error:", e)
                isConnected.value = false
                abortController = null
                // Retry logic
                setTimeout(() => connectSSE(), 5000)
            }
        } finally {
            isConnected.value = false
            abortController = null
        }
    }

    const disconnectSSE = () => {
        if (abortController) {
            abortController.abort()
            abortController = null
        }
        isConnected.value = false
        console.log("SSE Disconnected manually")
    }

    return {
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        fetchUnreadCount,
        markRead,
        removeNotification,
        removeAllNotifications,
        connectSSE,
        disconnectSSE
    }
})
