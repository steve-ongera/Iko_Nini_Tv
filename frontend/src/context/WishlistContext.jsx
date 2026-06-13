import React, { createContext, useState, useContext, useEffect } from 'react'
import { wishlistAPI } from '../services/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const WishlistContext = createContext()

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within WishlistProvider')
  return context
}

const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuth()

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([])
      return
    }
    setLoading(true)
    try {
      const response = await wishlistAPI.list()
      setWishlist(toArray(response.data))   // ← the fix
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
      setWishlist([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [isAuthenticated])

  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return { success: false }
    }
    try {
      const response = await wishlistAPI.add(productId)
      setWishlist(prev => [response.data, ...prev])
      toast.success('Added to wishlist')
      return { success: true, data: response.data }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Item already in wishlist')
      } else {
        toast.error('Failed to add to wishlist')
      }
      return { success: false }
    }
  }

  const removeFromWishlist = async (id) => {
    try {
      await wishlistAPI.remove(id)
      setWishlist(prev => prev.filter(item => item.id !== id))
      toast.success('Removed from wishlist')
      return { success: true }
    } catch (error) {
      toast.error('Failed to remove from wishlist')
      return { success: false }
    }
  }

  const isInWishlist = (productId) => {
    if (!Array.isArray(wishlist)) return false   // ← safety guard
    return wishlist.some(item =>
      item.product?.id === productId || item.product === productId
    )
  }

  return (
    <WishlistContext.Provider value={{ wishlist, loading, fetchWishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}