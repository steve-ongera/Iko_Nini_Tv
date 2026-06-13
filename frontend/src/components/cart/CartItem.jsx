import React from 'react'
import { Link } from 'react-router-dom'

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const product = item.product
  const imageUrl = product?.primary_image

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) onRemove()
    else onUpdateQuantity(newQuantity)
  }

  return (
    <div className="cart-item">

      {/* Image */}
      <div className="cart-item-image">
        <Link to={`/product/${product.slug}`}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--gray-100)'
            }}>
              <i className="bi bi-image" style={{ fontSize: '1.75rem', color: 'var(--gray-300)' }}></i>
            </div>
          )}
        </Link>
      </div>

      {/* Details */}
      <div className="cart-item-details">

        {/* Title + remove */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div>
            <Link to={`/product/${product.slug}`} className="cart-item-title">
              {product.name}
            </Link>
            {item.variant && (
              <div className="cart-item-variant">
                <i className="bi bi-tag" style={{ marginRight: '0.25rem' }}></i>
                {item.variant.name}
              </div>
            )}
            {product.brand && (
              <div className="cart-item-variant">{product.brand}</div>
            )}
          </div>

          <button
            onClick={onRemove}
            className="cart-item-remove"
            aria-label="Remove item"
          >
            <i className="bi bi-trash3"></i> Remove
          </button>
        </div>

        {/* Quantity + price row */}
        <div className="cart-item-actions">
          <div className="quantity-stepper">
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <i className="bi bi-dash"></i>
            </button>
            <input
              className="quantity-value"
              readOnly
              value={item.quantity}
            />
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <i className="bi bi-plus"></i>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
              KSh {Number(item.unit_price).toLocaleString()} each
            </span>
            {item.quantity > 1 && (
              <span className="cart-item-price">
                KSh {Number(item.subtotal || item.unit_price * item.quantity).toLocaleString()}
              </span>
            )}
            {item.quantity === 1 && (
              <span className="cart-item-price">
                KSh {Number(item.unit_price).toLocaleString()}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CartItem