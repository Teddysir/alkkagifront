import axios from './axios'

export const fetchCampaigns = async () => {
    const response = await axios.get('/campaigns/lists')
    return response.data
}
