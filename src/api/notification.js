import axios from './axios'

// Get notification list
export const getNotificationList = async () => {
    const response = await axios.get('/notifications/lists')
    return response.data
}

// Get unread count
export const getUnreadCount = async () => {
    const response = await axios.get('/notifications/counts')
    return response.data
}

// Mark as read
export const markAsRead = async (notificationId) => {
    const response = await axios.get(`/notifications/${notificationId}/read`)
    return response.data
}

// Delete notifications (single or multiple)
// Payload: { notificationIds: [1, 2] }
export const deleteNotifications = async (ids) => {
    const response = await axios.delete('/notifications', {
        data: { notificationIds: ids }
    })
    return response.data
}
