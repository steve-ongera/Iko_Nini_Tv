import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      const { access, refresh, user: userData } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      setIsAuthenticated(true)
      toast.success(`Welcome back, ${userData.first_name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { access, refresh, user } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      
      setUser(user)
      setIsAuthenticated(true)
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const errors = error.response?.data
      let message = 'Registration failed. Please check your details.'
      
      if (errors) {
        if (errors.email) message = errors.email[0]
        else if (errors.password2) message = errors.password2[0]
        else if (errors.password) message = errors.password[0]
      }
      
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Logged out successfully')
      window.location.href = '/'
    }
  }

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data)
      const updatedUser = response.data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      toast.success('Profile updated successfully')
      return { success: true, data: updatedUser }
    } catch (error) {
      toast.error('Failed to update profile')
      return { success: false, error: error.response?.data }
    }
  }

  const changePassword = async (oldPassword, newPassword, newPassword2) => {
    try {
      await authAPI.changePassword({ old_password: oldPassword, new_password: newPassword, new_password2: newPassword2 })
      toast.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.new_password2?.[0] || 'Failed to change password'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}