import axios from './axios'


export const logout = async () => {
    const response = await axios.post('/users/logout')
    return response.data
}

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

export const sendVerificationEmail = async (email) => {
    // POST /api/v1/users/email-verification/send
    const response = await axios.post('/users/email-verification/send', { email })
    return response.data
}

export const verifyEmailCode = async (email, authCode) => {
    // Guessing/Assuming explicit verification might be needed or useful
    // If not used, no harm. But based on user prompt "Signup with code field", maybe signup takes it.
    // I'll leave this out unless I need it.
    // Actually, I'll stick to just the requested SEND API for now to be safe.
}
