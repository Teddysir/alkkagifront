import axios from './axios'

// GET /api/v1/problems/{campaignProblemId}
export const getProblemDetail = async (campaignProblemId) => {
    const response = await axios.get(`/problems/${campaignProblemId}`)
    return response.data
}
// GET /api/v1/problems/today
export const getTodayProblems = async () => {
    const response = await axios.get('/problems/today')
    return response.data
}
