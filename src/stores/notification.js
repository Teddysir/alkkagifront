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

    // --- SSE Logic ---
    const connectSSE = () => {
        if (eventSource) return // Already connected

        // Using relative path via Vite proxy or absolute if configured? 
        // Assuming /api prefix is proxied to backend.
        // The user snippet uses "/api/v1/notifications/subscribe"
        // Adjust if axios baseURL is different, but EventSource doesn't use axios.
        // We typically need the full URL or relative to origin. 
        // If "api/v1" is proxied:
        const url = `${import.meta.env.VITE_API_BASE_URL || 'https://alkkagiback.shop'}/api/v1/notifications/subscribe`

        console.log("Connecting SSE to:", url)

        eventSource = new EventSource(url, { withCredentials: true })

        eventSource.addEventListener('INIT', (event) => {
            console.log("SSE Connected! (INIT)")
            isConnected.value = true
            fetchUnreadCount() // Sync count on connect
        })

        eventSource.addEventListener('NOTIFICATION', (event) => {
            console.log("SSE NOTIFICATION RECEIVED raw:", event.data)
            try {
                // If event.data is already an object (browser impl detail?), use it. Otherwise parse.
                const rawData = event.data
                const data = (typeof rawData === 'string') ? JSON.parse(rawData) : rawData

                console.log("SSE Parsed Payload:", data)

                // Refresh data
                fetchNotifications()
                fetchUnreadCount()
            } catch (e) {
                console.error("SSE Parse Error", e, event.data)
            }
        })

        eventSource.onerror = (e) => {
            console.log("SSE Error, retrying...", e)
            eventSource.close()
            eventSource = null
            isConnected.value = false
            // Retry logic usually automatic in browser but we can force reconnect after delay if needed
            setTimeout(() => connectSSE(), 3000)
        }
    }

    const disconnectSSE = () => {
        if (eventSource) {
            eventSource.close()
            eventSource = null
            isConnected.value = false
            console.log("SSE Disconnected")
        }
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
