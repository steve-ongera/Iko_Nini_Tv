import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { productsAPI } from '../services/api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import RatingStars from '../components/product/RatingStars'
import ReviewCard from '../components/product/ReviewCard'
import ProductCarousel from '../components/product/ProductCarousel'
import Loader from '../components/common/Loader'
import Breadcrumb from '../components/common/Breadcrumb'
import toast from 'react-hot-toast'

const ProductDetail = () => {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetchProduct()
    fetchReviews()
  }, [slug])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await productsAPI.detail(slug)
      setProduct(response.data)
      
      // Set default variant
      if (response.data.variants && response.data.variants.length > 0) {
        setSelectedVariant(response.data.variants[0])
      }
      
      // Fetch related products
      if (response.data.category) {
        const relatedRes = await productsAPI.list({ 
          category: response.data.category.slug,
          limit: 8
        })
        setRelatedProducts(relatedRes.data.results || relatedRes.data)
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await productsAPI.getReviews(slug)
      setReviews(response.data)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant)
    setQuantity(1)
  }

  const handleAddToCart = () => {
    const productId = product.id
    const variantId = selectedVariant?.id || null
    addToCart(productId, variantId, quantity)
  }

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }
    
    if (isInWishlist(product.id)) {
      // Find and remove
      const wishlistItem = wishlist.find(item => item.product.id === product.id)
      if (wishlistItem) {
        removeFromWishlist(wishlistItem.id)
      }
    } else {
      addToWishlist(product.id)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to submit a review')
      return
    }
    
    setSubmittingReview(true)
    try {
      await productsAPI.createReview(slug, reviewForm)
      toast.success('Review submitted successfully!')
      setReviewForm({ rating: 5, title: '', body: '' })
      fetchReviews()
    } catch (error) {
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return <Loader fullScreen />
  }

  if (!product) {
    return (
      <div className="container text-center py-5">
        <h3>Product not found</h3>
        <Link to="/store" className="btn btn-primary mt-3">Continue Shopping</Link>
      </div>
    )
  }

  const currentPrice = selectedVariant?.effective_price || product.price
  const discountPercent = product.discount_percent || 0
  const isWishlisted = isInWishlist ? isInWishlist(product.id) : false

  return (
    <>
      <Helmet>
        <title>{product.meta_title || product.name} - Iko Nini TV</title>
        <meta name="description" content={product.meta_description || product.short_description} />
        <meta name="keywords" content={product.meta_keywords} />
      </Helmet>

      <div className="container">
        <Breadcrumb 
          items={[
            { label: 'Home', link: '/' },
            { label: 'Store', link: '/store' },
            { label: product.category?.name, link: `/store?category=${product.category?.slug}` },
            { label: product.name },
          ]}
        />

        <div className="row g-4">
          {/* Product Images */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-image">
                {product.images && product.images[activeImage] ? (
                  <img 
                    src={product.images[activeImage].image} 
                    alt={product.images[activeImage].alt_text || product.name}
                    className="img-fluid"
                    style={{ width: '100%', height: '500px', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: '500px', background: '#f5f5f5' }}>
                    <i className="bi bi-image text-muted" style={{ fontSize: '5rem' }}></i>
                  </div>
                )}
                
                {discountPercent > 0 && (
                  <span className="position-absolute top-0 start-0 m-3 bg-danger text-white px-3 py-2 rounded">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
              
              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="d-flex gap-2 p-3 overflow-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`border ${activeImage === idx ? 'border-primary' : 'border-secondary'}`}
                      style={{ width: '80px', height: '80px', padding: 0 }}
                    >
                      <img 
                        src={img.image} 
                        alt={img.alt_text}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="col-md-6">
            <div className="mb-3">
              {product.brand && (
                <Link to={`/store?brand=${product.brand.slug}`} className="text-muted text-decoration-none">
                  {product.brand.name}
                </Link>
              )}
              <h1 className="display-6 fw-bold mt-2">{product.name}</h1>
              
              <div className="d-flex align-items-center gap-3 mt-2">
                <RatingStars rating={product.average_rating || 0} reviewCount={product.review_count || 0} />
                <Link to="#reviews" className="text-muted">
                  Write a review
                </Link>
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-baseline gap-2">
                <span className="display-6 text-primary fw-bold">
                  KSh {Number(currentPrice).toLocaleString()}
                </span>
                {product.compare_at_price && (
                  <span className="text-muted text-decoration-line-through">
                    KSh {Number(product.compare_at_price).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="mt-2">
                {product.in_stock ? (
                  <span className="badge bg-success">In Stock</span>
                ) : (
                  <span className="badge bg-danger">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-4">
                <h6>Select Variant</h6>
                <div className="d-flex flex-wrap gap-2">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantChange(variant)}
                      className={`btn ${selectedVariant?.id === variant.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      {variant.name}
                      {variant.price && variant.price !== product.price && (
                        <small className="d-block">KSh {Number(variant.price).toLocaleString()}</small>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <h6>Quantity</h6>
              <div className="d-flex align-items-center gap-3">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!product.in_stock}
                >
                  -
                </button>
                <span className="fs-5">{quantity}</span>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.in_stock}
                >
                  +
                </button>
                <span className="text-muted">
                  {product.track_stock && `${product.stock} available`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-3 mb-4">
              <button 
                onClick={handleAddToCart}
                className="btn btn-primary flex-grow-1 btn-lg"
                disabled={!product.in_stock}
              >
                <i className="bi bi-cart-plus"></i> Add to Cart
              </button>
              <button 
                onClick={handleWishlist}
                className="btn btn-outline-danger btn-lg"
              >
                <i className={`bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}`}></i>
              </button>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div className="alert alert-light">
                {product.short_description}
              </div>
            )}
          </div>
        </div>

        {/* Product Description */}
        <div className="row mt-5">
          <div className="col-12">
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#description">
                  Description
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link" data-bs-toggle="tab" data-bs-target="#specifications">
                  Specifications
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link" data-bs-toggle="tab" data-bs-target="#reviews">
                  Reviews ({product.review_count || 0})
                </button>
              </li>
            </ul>
            
            <div className="tab-content p-4 border border-top-0 rounded-bottom">
              <div className="tab-pane fade show active" id="description">
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
              
              <div className="tab-pane fade" id="specifications">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th>SKU</th>
                      <td>{product.sku}</td>
                    </tr>
                    <tr>
                      <th>Category</th>
                      <td>{product.category?.name}</td>
                    </tr>
                    <tr>
                      <th>Brand</th>
                      <td>{product.brand?.name}</td>
                    </tr>
                    {product.weight && (
                      <tr>
                        <th>Weight</th>
                        <td>{product.weight} kg</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="tab-pane fade" id="reviews">
                {/* Reviews List */}
                <div className="mb-4">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-muted">No reviews yet. Be the first to review!</p>
                  )}
                </div>
                
                {/* Review Form */}
                {isAuthenticated ? (
                  <form onSubmit={handleSubmitReview}>
                    <h6>Write a Review</h6>
                    <div className="mb-3">
                      <label className="form-label">Rating</label>
                      <div className="d-flex gap-2">
                        {[5, 4, 3, 2, 1].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="btn btn-link p-0"
                          >
                            <i className={`bi ${reviewForm.rating >= star ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
                               style={{ fontSize: '1.5rem' }}></i>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Review</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={reviewForm.body}
                        onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <div className="alert alert-info">
                    <Link to="/login">Login</Link> to write a review
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-5">
            <ProductCarousel 
              products={relatedProducts} 
              title="You May Also Like" 
            />
          </div>
        )}
      </div>
    </>
  )
}

export default ProductDetail