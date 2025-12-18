import axios from './axios'

export const login = async (email, password) => {
    const response = await axios.post('/users/login', { email, password });
    return response;
};

export const signup = async (userData) => {
    // userData: { email, nickname, password }
    const response = await axios.post('/users/signup', userData)
    return response.data
}

export const checkEmail = async (email) => {
    // Assuming GET or POST for check. Adjust based on actual backend API.
    // Common pattern: GET /users/check-email?email=...
    const response = await axios.get(`/users/check-email`, { params: { email } })
    return response.data
}

export const checkNickname = async (nickname) => {
    const response = await axios.get(`/users/check-nickname`, { params: { nickname } })
    return response.data
}
