import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import RatingStars from './RatingStars'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist, removeFromWishlist, wishlist } = useWishlist()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const discountPercent = product.discount_percent || 0
  const isInWish = isInWishlist ? isInWishlist(product.id) : false

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.in_stock) return
    addToCart(product.id, null, 1)
    toast.success('Added to cart')
  }

  const handleWishlistClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Please login to save items')
      navigate('/login')
      return
    }

    if (isInWish) {
      const item = wishlist.find(w => w.product?.id === product.id || w.product === product.id)
      if (item) await removeFromWishlist(item.id)
    } else {
      await addToWishlist(product.id)
    }
  }

  return (
    <Link to={`/product/${product.slug}`} className="product-card" style={{ textDecoration: 'none' }}>

      {/* Image */}
      <div className="product-card-image">
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} loading="lazy" />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gray-100)'
          }}>
            <i className="bi bi-image" style={{ fontSize: '2.5rem', color: 'var(--gray-300)' }}></i>
          </div>
        )}

        {/* Badges */}
        {discountPercent > 0 && (
          <span className="product-badge product-badge-discount">-{discountPercent}%</span>
        )}
        {product.is_flash_sale && !discountPercent && (
          <span className="product-badge product-badge-flash">Flash</span>
        )}
        {product.is_new && !product.is_flash_sale && !discountPercent && (
          <span className="product-badge product-badge-new">New</span>
        )}

        {/* Wishlist button */}
        <button
          className={`product-card-wishlist ${isInWish ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isInWish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`bi ${isInWish ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </button>

        {/* Quick add overlay */}
        <div className="product-card-quick-add" onClick={handleAddToCart}>
          <i className="bi bi-cart-plus"></i>
          {product.in_stock ? 'Quick Add' : 'Out of Stock'}
        </div>
      </div>

      {/* Body */}
      <div className="product-card-body">
        {product.brand && (
          <div className="product-card-brand">{product.brand}</div>
        )}

        <div className="product-card-title">{product.name}</div>

        {/* Rating */}
        {(product.average_rating > 0 || product.review_count > 0) && (
          <div className="product-card-rating">
            <RatingStars rating={product.average_rating || 0} size="small" />
            <span className="rating-count">({product.review_count || 0})</span>
          </div>
        )}

        {/* Pricing */}
        <div className="product-card-pricing">
          <span className="product-card-price">
            KSh {Number(product.price).toLocaleString()}
          </span>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
            <span className="product-card-old-price">
              KSh {Number(product.compare_at_price).toLocaleString()}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="product-card-discount-pill">-{discountPercent}%</span>
          )}
        </div>

        {/* Stock status */}
        {!product.in_stock && (
          <span className="badge badge-danger" style={{ fontSize: 'var(--text-xs)' }}>
            Out of Stock
          </span>
        )}

        {/* CTA */}
        <button
          className="product-card-cta"
          onClick={handleAddToCart}
          disabled={!product.in_stock}
          aria-label="Add to cart"
        >
          <i className="bi bi-cart-plus"></i>
          {product.in_stock ? 'Add to Cart' : 'Unavailable'}
        </button>
      </div>

    </Link>
  )
}

export default ProductCard