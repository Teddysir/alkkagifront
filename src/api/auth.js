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
    // Post request for duplicate check: /users/check/emails
    const response = await axios.post(`/users/check/emails`, { email })
    return response.data
}

export const checkNickname = async (nickname) => {
    // Post request for duplicate check: /users/check/nicknames
    const response = await axios.post(`/users/check/nicknames`, { nickname })
    return response.data
}
