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
