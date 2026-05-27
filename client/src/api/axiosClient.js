import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
})

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const is401 = err.response?.status === 401
    const isSessionCheck = url.includes('/users/me')
    if (is401 && !isSessionCheck) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default axiosClient
