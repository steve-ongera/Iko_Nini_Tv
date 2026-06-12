import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import EmptyState from '../components/common/EmptyState'
import Loader from '../components/common/Loader'

const Cart = () => {
  const { cart, loading, updateQuantity, removeItem, itemsCount, total } = useCart()

  if (loading) {
    return <Loader />
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <EmptyState 
        title="Your cart is empty"
        message="Looks like you haven't added any items to your cart yet"
        icon="bi-cart"
        actionText="Start Shopping"
        actionLink="/store"
      />
    )
  }

  return (
    <>
      <Helmet>
        <title>Shopping Cart - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <h2 className="mb-4">Shopping Cart ({itemsCount} items)</h2>
        
        <div className="row g-4">
          <div className="col-lg-8">
            {cart.items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
            
            <div className="mt-3">
              <Link to="/store" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left"></i> Continue Shopping
              </Link>
            </div>
          </div>
          
          <div className="col-lg-4">
            <CartSummary 
              subtotal={total}
              deliveryCost={0}
              total={total}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default Cart