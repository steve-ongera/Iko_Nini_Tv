import React from 'react'
import { Link } from 'react-router-dom'

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const product = item.product
  const imageUrl = product?.primary_image
  
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      onRemove()
    } else {
      onUpdateQuantity(newQuantity)
    }
  }

  return (
    <div className="cart-item">
      <Link to={`/product/${product.slug}`} className="cart-item-image-link">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="cart-item-image" />
        ) : (
          <div className="cart-item-image bg-light d-flex align-items-center justify-content-center">
            <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
          </div>
        )}
      </Link>
      
      <div className="cart-item-details">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Link to={`/product/${product.slug}`} className="text-decoration-none text-dark">
              <h6 className="cart-item-title">{product.name}</h6>
            </Link>
            {item.variant && (
              <small className="text-muted">Variant: {item.variant.name}</small>
            )}
          </div>
          <button onClick={onRemove} className="btn btn-link text-danger p-0">
            <i className="bi bi-trash"></i>
          </button>
        </div>
        
        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="cart-item-quantity">
            <button 
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.quantity - 1)}
            >
              -
            </button>
            <span className="mx-2">{item.quantity}</span>
            <button 
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.quantity + 1)}
            >
              +
            </button>
          </div>
          
          <div className="text-end">
            <span className="cart-item-price">
              KSh {Number(item.unit_price).toLocaleString()}
            </span>
            {item.quantity > 1 && (
              <small className="text-muted d-block">
                Total: KSh {Number(item.subtotal).toLocaleString()}
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartItem