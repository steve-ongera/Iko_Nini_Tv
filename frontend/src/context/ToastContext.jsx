import React, { createContext, useContext } from 'react'
import toast from 'react-hot-toast'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const showSuccess = (message) => {
    toast.success(message)
  }

  const showError = (message) => {
    toast.error(message)
  }

  const showInfo = (message) => {
    toast(message)
  }

  const showLoading = (message) => {
    return toast.loading(message)
  }

  const dismiss = (toastId) => {
    toast.dismiss(toastId)
  }

  const value = {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    dismiss,
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}