import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import Loader from '../components/common/Loader'

const Cart = () => {
  const { cart, loading, updateQuantity, removeItem, itemsCount, total } = useCart()

  if (loading) return <Loader />

  if (!cart || !cart.items?.length) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-cart3"></i>
          </div>
          <div className="empty-state-title">Your cart is empty</div>
          <div className="empty-state-desc">
            Looks like you haven't added anything yet. Browse our store and find something you'll love.
          </div>
          <Link to="/store" className="btn btn-primary btn-lg">
            <i className="bi bi-bag"></i> Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{`Shopping Cart (${itemsCount}) — Iko Nini TV`}</title>
      </Helmet>

      <div className="container">

        {/* Page header */}
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
          <h2 className="section-title">
            <span className="section-title-accent"></span>
            Shopping Cart
            <span className="badge badge-red" style={{ marginLeft: '0.75rem', fontSize: 'var(--text-sm)' }}>
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
            </span>
          </h2>
          <Link to="/store" className="section-view-all">
            <i className="bi bi-arrow-left"></i> Continue Shopping
          </Link>
        </div>

        {/* Cart layout */}
        <div className="cart-layout">

          {/* Items panel */}
          <div className="cart-items-panel">
            <div className="cart-items-header">
              <h5>Items in your cart</h5>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {cart.items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          {/* Order summary */}
          <CartSummary
            subtotal={total}
            deliveryCost={0}
            total={total}
          />

        </div>
      </div>
    </>
  )
}

export default Cart