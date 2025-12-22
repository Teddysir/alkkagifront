import axios from './axios'

export const fetchCampaigns = async () => {
    const response = await axios.get('/campaigns/lists')
    return response.data
}

export const createCampaign = async (formData) => {
    // Note: Axios automatically sets Content-Type to multipart/form-data when data is FormData
    const response = await axios.post('/campaigns', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}

export const getCampaignDetail = async (id) => {
    const response = await axios.get(`/campaigns/${id}`)
    return response.data
}

export const getCampaignProblems = async (id, params = {}) => {
    const response = await axios.get(`/campaigns/${id}/problems/lists`, { params })
    return response.data
}

export const searchProblems = async (params) => {
    // params: { 'platform-type': 'BOJ'|'PROGRAMMERS'|'SWEA', keyword: 'string' }
    const response = await axios.get('/problems', { params })
    return response.data
}

export const addCampaignProblems = async (campaignId, payload) => {
    // payload: { problems: [{ problemId, startDate, endDate }] }
    const response = await axios.post(`/campaigns/${campaignId}/problems`, payload)
    return response.data
}

export const deleteCampaignProblem = async (campaignId, problemId) => {
    // DELETE /campaigns/{campaignId}/problems?campaignProblemId={problemId}
    const response = await axios.delete(`/campaigns/${campaignId}/problems/${problemId}`)
    return response.data
}

export const joinCampaign = async (campaignId) => {
    // GET /campaigns/join/{campaignId}
    const response = await axios.get(`/campaigns/join/${campaignId}`)
    return response.data
}

export const withdrawCampaign = async (campaignId) => {
    // DELETE /campaigns/withdraw/{campaignId}
    const response = await axios.delete(`/campaigns/withdraw/${campaignId}`)
    return response.data
}
