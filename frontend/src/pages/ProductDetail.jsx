import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link, useNavigate } from 'react-router-dom'
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

// same toArray guard used in Sidebar
const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('description')
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist, removeFromWishlist, wishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchProduct()
    fetchReviews()
  }, [slug])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const res = await productsAPI.detail(slug)
      setProduct(res.data)
      if (res.data.variants?.length > 0) setSelectedVariant(res.data.variants[0])
      if (res.data.category) {
        const rel = await productsAPI.list({ category: res.data.category.slug, limit: 8 })
        setRelatedProducts(toArray(rel.data))
      }
    } catch {
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await productsAPI.getReviews(slug)
      setReviews(toArray(res.data))   // ← fixes "reviews.map is not a function"
    } catch {
      setReviews([])
    }
  }

  const handleAddToCart = () => {
    addToCart(product.id, selectedVariant?.id || null, quantity)
    toast.success('Added to cart!')
  }

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to save items')
      navigate('/login')
      return
    }
    if (isInWishlist(product.id)) {
      const item = wishlist.find(w => w.product?.id === product.id || w.product === product.id)
      if (item) removeFromWishlist(item.id)
    } else {
      addToWishlist(product.id)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Please login to submit a review'); return }
    setSubmittingReview(true)
    try {
      await productsAPI.createReview(slug, reviewForm)
      toast.success('Review submitted!')
      setReviewForm({ rating: 5, title: '', body: '' })
      fetchReviews()
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <Loader fullScreen />

  if (!product) return (
    <div className="container">
      <div className="empty-state">
        <div className="empty-state-icon"><i className="bi bi-box-seam"></i></div>
        <div className="empty-state-title">Product not found</div>
        <div className="empty-state-desc">This product may have been removed or the link is incorrect.</div>
        <Link to="/store" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  )

  const currentPrice    = selectedVariant?.effective_price || product.price
  const discountPercent = product.discount_percent || 0
  const isWishlisted    = isInWishlist ? isInWishlist(product.id) : false
  const images          = product.images || []

  return (
    <>
      <Helmet>
        <title>{`${product.meta_title || product.name} — Iko Nini TV`}</title>
        <meta name="description" content={product.meta_description || product.short_description} />
      </Helmet>

      <div className="container">

        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Home', link: '/' },
          { label: 'Store', link: '/store' },
          { label: product.category?.name, link: `/store?category=${product.category?.slug}` },
          { label: product.name },
        ]} />

        {/* ── Main layout ─────────────────────────────────────────────── */}
        <div className="product-detail-layout">

          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-gallery-main">
              {images[activeImage] ? (
                <img
                  src={images[activeImage].image}
                  alt={images[activeImage].alt_text || product.name}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'var(--gray-100)'
                }}>
                  <i className="bi bi-image" style={{ fontSize: '4rem', color: 'var(--gray-300)' }}></i>
                </div>
              )}

              {discountPercent > 0 && (
                <span className="product-badge product-badge-discount"
                  style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '0.75rem', padding: '0.3em 0.7em' }}>
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="product-gallery-thumbs">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`product-thumb ${activeImage === idx ? 'active' : ''}`}
                    onClick={() => setActiveImage(idx)}
                  >
                    <img src={img.image} alt={img.alt_text || product.name} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div>
            {/* Brand + title */}
            {product.brand && (
              <div className="product-info-brand">
                <Link to={`/store?brand=${product.brand.slug}`}>{product.brand.name}</Link>
              </div>
            )}
            <h1 className="product-info-title">{product.name}</h1>

            {/* Rating */}
            <div className="product-info-rating">
              <RatingStars rating={product.average_rating || 0} reviewCount={product.review_count || 0} />
              <button
                onClick={() => setActiveTab('reviews')}
                style={{ background: 'none', border: 'none', fontSize: 'var(--text-sm)',
                  color: 'var(--brand-red)', cursor: 'pointer', fontWeight: 600 }}
              >
                Write a review
              </button>
            </div>

            {/* Pricing */}
            <div className="product-info-pricing">
              <div className="product-info-price-row">
                <span className="product-info-price">
                  KSh {Number(currentPrice).toLocaleString()}
                </span>
                {product.compare_at_price && Number(product.compare_at_price) > Number(currentPrice) && (
                  <span className="product-info-old-price">
                    KSh {Number(product.compare_at_price).toLocaleString()}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="product-info-discount">-{discountPercent}%</span>
                )}
              </div>
            </div>

            {/* Stock */}
            <div className={`product-info-stock ${product.in_stock ? (product.stock < 10 ? 'low-stock' : 'in-stock') : 'out-stock'}`}>
              <i className={`bi ${product.in_stock ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
              {product.in_stock
                ? product.track_stock && product.stock < 10
                  ? `Only ${product.stock} left in stock`
                  : 'In Stock'
                : 'Out of Stock'}
            </div>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="variant-group">
                <div className="variant-group-label">
                  Select Variant
                  {selectedVariant && <span style={{ color: 'var(--brand-red)', marginLeft: '0.5rem' }}>— {selectedVariant.name}</span>}
                </div>
                <div className="variant-options">
                  {product.variants.map(v => (
                    <div
                      key={v.id}
                      className={`variant-option ${selectedVariant?.id === v.id ? 'active' : ''} ${!v.in_stock ? 'disabled' : ''}`}
                      onClick={() => v.in_stock && setSelectedVariant(v)}
                    >
                      {v.name}
                      {v.price && v.price !== product.price && (
                        <span style={{ display: 'block', fontSize: 'var(--text-xs)', opacity: 0.75 }}>
                          KSh {Number(v.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="variant-group">
              <div className="variant-group-label">Quantity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="quantity-stepper">
                  <button className="quantity-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={!product.in_stock}>
                    <i className="bi bi-dash"></i>
                  </button>
                  <input className="quantity-value" readOnly value={quantity} />
                  <button className="quantity-btn" onClick={() => setQuantity(q => q + 1)} disabled={!product.in_stock}>
                    <i className="bi bi-plus"></i>
                  </button>
                </div>
                {product.track_stock && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                    {product.stock} available
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="product-cta-row">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={!product.in_stock}
              >
                <i className="bi bi-cart-plus"></i>
                {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                className={`btn btn-lg product-cta-wishlist ${isWishlisted ? 'btn-danger' : 'btn-outline-primary'}`}
                onClick={handleWishlist}
                aria-label="Wishlist"
                style={{ width: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className={`bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}`}></i>
              </button>
            </div>

            {/* Short description */}
            {product.short_description && (
              <div className="alert alert-info" style={{ fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-lg)' }}>
                <i className="bi bi-info-circle" style={{ marginRight: '0.5rem' }}></i>
                {product.short_description}
              </div>
            )}

            {/* Delivery info */}
            <div className="delivery-info-card">
              <div className="delivery-info-row">
                <i className="bi bi-truck delivery-info-icon"></i>
                <div className="delivery-info-text">
                  <h6>Fast Delivery</h6>
                  <p>Nairobi: 1–2 days · Rest of Kenya: 3–5 days</p>
                </div>
              </div>
              <div className="delivery-info-row">
                <i className="bi bi-shield-check delivery-info-icon"></i>
                <div className="delivery-info-text">
                  <h6>Secure Payment</h6>
                  <p>M-Pesa, PayPal, Visa & Mastercard accepted</p>
                </div>
              </div>
              <div className="delivery-info-row">
                <i className="bi bi-arrow-counterclockwise delivery-info-icon"></i>
                <div className="delivery-info-text">
                  <h6>7-Day Returns</h6>
                  <p>Not satisfied? Return it within 7 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div style={{ marginTop: '2.5rem' }}>

          {/* Tab headers */}
          <div style={{
            display: 'flex', borderBottom: '2px solid var(--gray-150)',
            gap: 0, marginBottom: '1.5rem'
          }}>
            {[
              { key: 'description', label: 'Description' },
              { key: 'specifications', label: 'Specifications' },
              { key: 'reviews', label: `Reviews (${product.review_count || reviews.length || 0})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid var(--brand-red)' : '2px solid transparent',
                  marginBottom: '-2px',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  color: activeTab === tab.key ? 'var(--brand-red)' : 'var(--gray-600)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  transition: 'var(--transition-fast)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Description */}
          {activeTab === 'description' && (
            <div
              style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }}
            />
          )}

          {/* Specifications */}
          {activeTab === 'specifications' && (
            <div style={{
              background: 'white', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-150)', overflow: 'hidden'
            }}>
              {[
                { label: 'SKU', value: product.sku },
                { label: 'Category', value: product.category?.name },
                { label: 'Brand', value: product.brand?.name },
                product.weight && { label: 'Weight', value: `${product.weight} kg` },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '160px 1fr',
                  borderBottom: '1px solid var(--gray-100)',
                  fontSize: 'var(--text-sm)',
                }}>
                  <div style={{
                    padding: '0.75rem 1rem', fontWeight: 600,
                    color: 'var(--gray-700)', background: 'var(--gray-50)'
                  }}>{row.label}</div>
                  <div style={{ padding: '0.75rem 1rem', color: 'var(--gray-800)' }}>{row.value || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div>
              {/* List */}
              {reviews.length > 0 ? (
                <div style={{ marginBottom: '2rem' }}>
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon" style={{ width: 60, height: 60, fontSize: '1.75rem' }}>
                    <i className="bi bi-chat-square-text"></i>
                  </div>
                  <div className="empty-state-title" style={{ fontSize: 'var(--text-lg)' }}>No reviews yet</div>
                  <div className="empty-state-desc">Be the first to share your experience with this product.</div>
                </div>
              )}

              {/* Review form */}
              {isAuthenticated ? (
                <div style={{
                  background: 'white', border: '1px solid var(--gray-150)',
                  borderRadius: 'var(--radius-xl)', padding: '1.5rem'
                }}>
                  <h5 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>
                    Write a Review
                  </h5>
                  <form onSubmit={handleSubmitReview}>

                    {/* Star picker */}
                    <div className="form-group">
                      <label className="form-label">Your Rating</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <i
                              className={`bi ${reviewForm.rating >= star ? 'bi-star-fill' : 'bi-star'}`}
                              style={{ fontSize: '1.5rem', color: reviewForm.rating >= star ? 'var(--color-warning)' : 'var(--gray-300)' }}
                            ></i>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Review Title <span className="form-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Summarise your experience"
                        value={reviewForm.title}
                        onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Review <span className="form-label-required">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="What did you like or dislike?"
                        value={reviewForm.body}
                        onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className={`btn btn-primary ${submittingReview ? 'loading' : ''}`}
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="alert alert-info">
                  <i className="bi bi-person-circle"></i>
                  <div className="alert-content">
                    <Link to="/login" style={{ fontWeight: 700, color: 'var(--color-info-text)' }}>Sign in</Link>
                    {' '}to write a review for this product.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Related products ─────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-accent"></span>
                You May Also Like
              </h2>
            </div>
            <ProductCarousel products={relatedProducts} />
          </div>
        )}

      </div>
    </>
  )
}

export default ProductDetail