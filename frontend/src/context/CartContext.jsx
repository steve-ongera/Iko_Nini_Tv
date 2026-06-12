import React, { createContext, useState, useContext, useEffect } from 'react'
import { cartAPI } from '../services/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [itemsCount, setItemsCount] = useState(0)
  const [total, setTotal] = useState(0)
  const { isAuthenticated } = useAuth()

  const fetchCart = async () => {
    setLoading(true)
    try {
      const response = await cartAPI.get()
      const cartData = response.data
      setCart(cartData)
      setItemsCount(cartData.items_count || 0)
      setTotal(cartData.total || 0)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [isAuthenticated])

  const addToCart = async (productId, variantId = null, quantity = 1) => {
    try {
      const response = await cartAPI.add(productId, variantId, quantity)
      setCart(response.data)
      setItemsCount(response.data.items_count)
      setTotal(response.data.total)
      toast.success('Added to cart successfully!')
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
      setItemsCount(response.data.items_count)
      setTotal(response.data.total)
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
      setItemsCount(response.data.items_count)
      setTotal(response.data.total)
      toast.success('Item removed from cart')
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
      toast.success('Cart cleared')
      return { success: true }
    } catch (error) {
      toast.error('Failed to clear cart')
      return { success: false }
    }
  }

  const value = {
    cart,
    loading,
    itemsCount,
    total,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}