import axios from './axios'

export const submitCode = async (campaignProblemId, payload) => {
    // payload: { language: 'java', code: '...' }
    const response = await axios.post(`/submissions/${campaignProblemId}`, payload)
    return response.data
}

export const getSubmissionList = async (campaignProblemId, params = {}) => {
    // GET /submissions/{campaignProblemId}/lists
    // params: page, size, sortBy, sortDirection
    const response = await axios.get(`/submissions/${campaignProblemId}/lists`, { params })
    return response.data
}

export const getLatestSubmission = async (campaignProblemId) => {
    // GET /submissions/{campaignProblemId}/latest
    const response = await axios.get(`/submissions/${campaignProblemId}/latest`)
    return response.data
}

export const getMySubmissions = async (campaignProblemId, params = {}) => {
    // Legacy support or specific use case if needed
    const response = await axios.get(`/submissions/${campaignProblemId}/my`, { params })
    return response.data
}

export const getSubmissionDetail = async (submissionId) => {
    const response = await axios.get(`/submissions/${submissionId}`)
    return response.data
}

export const searchAlgorithms = async (keyword) => {
    // GET /algorithms?keyword={keyword}
    const response = await axios.get('/submissions/algorithms', { params: { keyword } })
    return response.data
}
