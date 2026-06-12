import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import RatingStars from './RatingStars'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  const handleWishlistClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }
    
    if (isInWishlist(product.id)) {
      // Find wishlist item ID
      const wishlistItem = await fetchWishlistItemId(product.id)
      if (wishlistItem) {
        await removeFromWishlist(wishlistItem.id)
      }
    } else {
      await addToWishlist(product.id)
    }
  }

  const fetchWishlistItemId = async (productId) => {
    // This would need access to wishlist state
    // For now, we'll implement through context
    return null
  }

  const discountPercent = product.discount_percent || 0
  const isInWish = isInWishlist ? isInWishlist(product.id) : false

  return (
    <div className="card h-100 product-card">
      <Link to={`/product/${product.slug}`} className="text-decoration-none">
        <div className="card-image">
          {product.primary_image ? (
            <img src={product.primary_image} alt={product.name} loading="lazy" />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 bg-light">
              <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
            </div>
          )}
          
          {discountPercent > 0 && (
            <span className="position-absolute top-0 start-0 m-2 bg-danger text-white px-2 py-1 rounded small">
              -{discountPercent}%
            </span>
          )}
          
          {product.is_flash_sale && (
            <span className="position-absolute top-0 end-0 m-2 bg-warning text-dark px-2 py-1 rounded small">
              Flash Sale
            </span>
          )}
        </div>
        
        <div className="card-body">
          <div className="text-muted small mb-1">
            {product.category_name || 'Uncategorized'}
          </div>
          
          <h6 className="card-title">{product.name}</h6>
          
          <div className="mb-2">
            <RatingStars rating={product.average_rating || 0} reviewCount={product.review_count || 0} size="small" />
          </div>
          
          <div className="d-flex align-items-center justify-content-between mt-2">
            <div>
              <span className="card-price">KSh {Number(product.price).toLocaleString()}</span>
              {product.compare_at_price && (
                <span className="card-old-price">
                  KSh {Number(product.compare_at_price).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          {!product.in_stock && (
            <div className="text-danger small mt-1">Out of Stock</div>
          )}
        </div>
      </Link>
      
      <div className="card-footer bg-transparent border-0 pb-3 pt-0">
        <div className="d-flex gap-2">
          <button
            onClick={() => addToCart(product.id, null, 1)}
            className="btn btn-primary flex-grow-1"
            disabled={!product.in_stock}
          >
            <i className="bi bi-cart-plus"></i> Add to Cart
          </button>
          
          <button
            onClick={handleWishlistClick}
            className="btn btn-outline-danger"
          >
            <i className={`bi ${isInWish ? 'bi-heart-fill' : 'bi-heart'}`}></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard