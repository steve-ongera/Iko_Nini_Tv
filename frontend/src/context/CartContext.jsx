// CartContext.jsx — full fixed version
import React, { createContext, useState, useContext, useEffect, useRef } from 'react'
import { cartAPI } from '../services/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [itemsCount, setItemsCount] = useState(0)
  const [total, setTotal] = useState(0)
  const { isAuthenticated } = useAuth()

  // Track previous auth state to prevent unnecessary re-fetches
  const prevAuthRef = useRef(null)
  // Prevent concurrent fetches
  const fetchingRef = useRef(false)

  const fetchCart = async () => {
    if (fetchingRef.current) return   // already in-flight
    fetchingRef.current = true
    setLoading(true)
    try {
      const response = await cartAPI.get()
      const cartData = response.data
      setCart(cartData)
      setItemsCount(cartData.items_count || 0)
      setTotal(parseFloat(cartData.total) || 0)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      // Don't toast on 429 — it would spam the user
      if (error.response?.status !== 429) {
        // silent fail — cart just stays null
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    // Only re-fetch when auth state actually changes value
    if (prevAuthRef.current === isAuthenticated) return
    prevAuthRef.current = isAuthenticated

    if (isAuthenticated) {
      fetchCart()
    } else {
      // User logged out — clear cart locally, no API call needed
      setCart({ items: [], items_count: 0, total: 0 })
      setItemsCount(0)
      setTotal(0)
    }
  }, [isAuthenticated])

  const addToCart = async (productId, variantId = null, quantity = 1) => {
    try {
      const response = await cartAPI.add(productId, variantId, quantity)
      setCart(response.data)
      setItemsCount(response.data.items_count || 0)
      setTotal(parseFloat(response.data.total) || 0)
      toast.success('Added to cart!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to add to cart')
      return { success: false, error: error.response?.data }
    }
  }

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await cartAPI.update(itemId, quantity)
      setCart(response.data)
      setItemsCount(response.data.items_count || 0)
      setTotal(parseFloat(response.data.total) || 0)
      return { success: true }
    } catch (error) {
      toast.error('Failed to update cart')
      return { success: false }
    }
  }

  const removeItem = async (itemId) => {
    try {
      const response = await cartAPI.remove(itemId)
      setCart(response.data)
      setItemsCount(response.data.items_count || 0)
      setTotal(parseFloat(response.data.total) || 0)
      toast.success('Item removed')
      return { success: true }
    } catch (error) {
      toast.error('Failed to remove item')
      return { success: false }
    }
  }

  const clearCart = async () => {
    try {
      await cartAPI.clear()
      setCart({ items: [], items_count: 0, total: 0 })
      setItemsCount(0)
      setTotal(0)
      return { success: true }
    } catch (error) {
      toast.error('Failed to clear cart')
      return { success: false }
    }
  }

  return (
    <CartContext.Provider value={{ cart, loading, itemsCount, total, fetchCart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}