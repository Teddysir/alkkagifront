import instance from './axios'

/**
 * Get Review Matching status for a specific campaign problem
 * @param {Number} campaignProblemId 
 */
export const getReviewMatches = (campaignProblemId) => {
    return instance.get(`/reviews/${campaignProblemId}/matches`)
}
// Get Review List for a submission
export const getReviews = (submissionId) => {
    return instance.get(`/reviews/${submissionId}`)
}

// Create a new review
export const createReview = (data) => {
    return instance.post('/reviews', data)
}

// Update a review
export const updateReview = (reviewId, data) => {
    return instance.put(`/reviews/${reviewId}`, data)
}

// Delete a review
export const deleteReview = (reviewId) => {
    return instance.delete(`/reviews/${reviewId}`)
}

// Toggle Like on a review
export const toggleLikeReview = (reviewId) => {
    return instance.post(`/reviews/${reviewId}/likes`)
}
