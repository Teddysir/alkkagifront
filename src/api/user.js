import axios from './axios'

export const getUserProfile = async () => {
    const response = await axios.get('/users/profiles')
    return response.data
}

// data: { description, nickname }
export const updateUserProfile = async (data) => {
    const response = await axios.put('/users/profiles', data)
    return response.data
}

// url: string
export const updateProfileImage = async (url) => {
    const response = await axios.post('/users/profile-images', { profile_image: url })
    return response.data
}

export const deleteProfileImage = async () => {
    const response = await axios.put('/users/profile-images') // No payload per instructions
    return response.data
}
