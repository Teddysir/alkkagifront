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

// file: File object
export const updateProfileImage = async (file) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await axios.post('/users/profile-images', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}

// { message: "...", data: { userId: 1, score: 18 } }
export const getUserTier = async () => {
    const response = await axios.get('/users/tier')
    return response.data
}

export const deleteProfileImage = async () => {
    const response = await axios.put('/users/profile-images') // No payload per instructions
    return response.data
}
