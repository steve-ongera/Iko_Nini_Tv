import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        })

        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access)
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register/', userData),
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/', { refresh: localStorage.getItem('refresh_token') }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/password/change/', data),
  forgotPassword: (email) => api.post('/auth/password/reset/', { email }),
  resetPassword: (token, data) => api.post(`/auth/password/reset/confirm/`, { token, ...data }),
}

// User Addresses API
export const addressAPI = {
  list: () => api.get('/auth/addresses/'),
  create: (data) => api.post('/auth/addresses/', data),
  update: (id, data) => api.put(`/auth/addresses/${id}/`, data),
  delete: (id) => api.delete(`/auth/addresses/${id}/`),
}

// Products API
export const productsAPI = {
  list: (params) => api.get('/products/', { params }),
  featured: () => api.get('/products/featured/'),
  flashSales: () => api.get('/products/flash-sales/'),
  detail: (slug) => api.get(`/products/${slug}/`),
  getReviews: (slug) => api.get(`/products/${slug}/reviews/`),
  createReview: (slug, data) => api.post(`/products/${slug}/reviews/create/`, data),
  search: (params) => api.get('/search/', { params }),
}

// Categories API
export const categoriesAPI = {
  list: () => api.get('/categories/'),
  detail: (slug) => api.get(`/categories/${slug}/`),
}

// Brands API
export const brandsAPI = {
  list: () => api.get('/brands/'),
}

// Cart API
export const cartAPI = {
  get: () => api.get('/cart/'),
  add: (productId, variantId = null, quantity = 1) => 
    api.post('/cart/add/', { product_id: productId, variant_id: variantId, quantity }),
  update: (itemId, quantity) => api.put(`/cart/items/${itemId}/`, { quantity }),
  remove: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clear: () => api.delete('/cart/clear/'),
}

// Wishlist API
export const wishlistAPI = {
  list: () => api.get('/wishlist/'),
  add: (productId) => api.post('/wishlist/', { product_id: productId }),
  remove: (id) => api.delete(`/wishlist/${id}/`),
}

// Delivery API
export const deliveryAPI = {
  getCounties: () => api.get('/counties/'),
  getPickupStations: (countyId) => api.get(`/counties/${countyId}/pickup-stations/`),
  getPickupStation: (id) => api.get(`/pickup-stations/${id}/`),
  calculateCost: (data) => api.post('/delivery/calculate/', data),
}

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders/place/', data),
  list: () => api.get('/orders/'),
  detail: (orderNumber) => api.get(`/orders/${orderNumber}/`),
  cancel: (orderNumber) => api.post(`/orders/${orderNumber}/cancel/`),
}

// Payments API
export const paymentsAPI = {
  mpesaInitiate: (orderId, phoneNumber) => 
    api.post('/payments/mpesa/initiate/', { order_id: orderId, phone_number: phoneNumber }),
  mpesaStatus: (checkoutRequestId) => 
    api.get(`/payments/mpesa/status/${checkoutRequestId}/`),
  paypalCreateOrder: (orderId) => 
    api.post('/payments/paypal/create-order/', { order_id: orderId }),
  paypalCapture: (paypalOrderId) => 
    api.post('/payments/paypal/capture/', { paypal_order_id: paypalOrderId }),
}

// Banners API
export const bannersAPI = {
  list: () => api.get('/banners/'),
}

export default api