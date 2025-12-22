import axios from './axios'

// GET /api/v1/submissions/algorithms?keyword={keyword}
export const searchAlgorithms = async (keyword) => {
    const response = await axios.get(`/submissions/algorithm`, {
        params: { keyword }
    })
    return response.data
}

// POST /api/v1/submissions/{campaignProblemId}
export const submitCode = async (campaignProblemId, payload) => {
    // payload: { language, code, strategy, execTime, memory, algorithmList, isSuccess }
    const response = await axios.post(`/submissions/${campaignProblemId}`, payload)
    return response.data
}

// GET /api/v1/submissions/{submissionId}
export const getSubmissionDetail = async (submissionId) => {
    const response = await axios.get(`/submissions/${submissionId}`)
    return response.data
}
