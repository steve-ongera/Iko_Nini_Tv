import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { productsAPI, bannersAPI } from '../services/api'
import ProductCarousel from '../components/product/ProductCarousel'
import Loader from '../components/common/Loader'

// ─── Countdown Timer Hook ─────────────────────────────────────────────────────
const useCountdown = (targetHours = 8) => {
  const getTime = () => {
    const now = new Date()
    const end = new Date()
    end.setHours(now.getHours() + targetHours, 0, 0, 0)
    const diff = Math.max(0, end - now)
    return {
      h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
      m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
    }
  }
  const [time, setTime] = useState(getTime)
  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────
const HeroSlider = ({ banners }) => {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(() => setActive(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(id)
  }, [banners.length])

  const prev = () => setActive(i => (i - 1 + banners.length) % banners.length)
  const next = () => setActive(i => (i + 1) % banners.length)

  // Fallback slides when no banners from API
  const slides = banners.length > 0 ? banners : [
    {
      id: 1,
      image: '/images/hero-banner.png',
      tag: 'New Arrivals',
      title: 'Shop Smart,\nLive Better',
      subtitle: 'Kenya\'s premier marketplace — electronics, fashion, home goods and more.',
      price: 'From KSh 500',
      link: '/store',
    },
    {
      id: 2,
      image: '/images/hero-banner-2.png',
      tag: 'Flash Sale',
      title: 'Up to 60% Off\nToday Only',
      subtitle: 'Don\'t miss these limited-time deals across all categories.',
      price: 'Ends tonight',
      link: '/store?is_flash_sale=true',
    },
  ]

  return (
    <div className="hero-slider">
      {slides.map((slide, i) => (
        <div key={slide.id} className={`hero-slide ${i === active ? 'active' : ''}`}>
          {slide.image && (
            <img src={slide.image} alt={slide.title} className="hero-slide-bg" />
          )}
          {/* dark gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(15,28,46,0.72) 0%, rgba(15,28,46,0.3) 60%, transparent 100%)'
          }} />
          <div className="hero-slide-content">
            {slide.tag && (
              <div className="hero-slide-tag">
                <i className="bi bi-lightning-charge-fill"></i> {slide.tag}
              </div>
            )}
            <h1 className="hero-slide-title" style={{ whiteSpace: 'pre-line' }}>
              {slide.title || 'Shop Smart,\nLive Better'}
            </h1>
            <p className="hero-slide-subtitle">
              {slide.subtitle}
            </p>
            {slide.price && (
              <div className="hero-slide-price">{slide.price}</div>
            )}
            <Link to={slide.link || '/store'} className="btn btn-orange btn-lg">
              Shop Now <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow-prev" onClick={prev} aria-label="Previous">
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="hero-arrow hero-arrow-next" onClick={next} aria-label="Next">
            <i className="bi bi-chevron-right"></i>
          </button>
          <div className="hero-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === active ? 'active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [flashSales, setFlashSales] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const countdown = useCountdown(8)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [featuredRes, flashRes, bannersRes] = await Promise.all([
        productsAPI.featured(),
        productsAPI.flashSales(),
        bannersAPI.list(),
      ])
      setFeaturedProducts(featuredRes.data)
      setFlashSales(flashRes.data)
      setBanners(bannersRes.data)
    } catch (err) {
      console.error('Failed to fetch home data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader fullScreen />

  return (
    <>
      <Helmet>
        <title>Iko Nini TV — Shop Smart, Live Better</title>
        <meta name="description" content="Kenya's premier e-commerce marketplace. Shop electronics, fashion, home goods and more with fast delivery and secure M-Pesa payments." />
      </Helmet>

      <div className="container">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="hero-section" style={{ paddingTop: '1rem' }}>
          <HeroSlider banners={banners} />

          {/* Sidebar mini-banners */}
          <div className="hero-sidebar">
            <Link to="/store?is_flash_sale=true" className="hero-mini-banner">
              <div style={{
                background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
                width: '100%', height: '100%', position: 'absolute', inset: 0
              }} />
              <div className="hero-mini-banner-overlay">
                <div className="hero-mini-banner-title">Flash Sales</div>
                <div className="hero-mini-banner-sub">Up to 60% off today</div>
              </div>
            </Link>
            <Link to="/store?is_new=true" className="hero-mini-banner">
              <div style={{
                background: 'linear-gradient(135deg, #1d3557 0%, #2b4a7a 100%)',
                width: '100%', height: '100%', position: 'absolute', inset: 0
              }} />
              <div className="hero-mini-banner-overlay">
                <div className="hero-mini-banner-title">New Arrivals</div>
                <div className="hero-mini-banner-sub">Fresh drops every week</div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Trust Strip ──────────────────────────────────────────────── */}
        <div className="trust-strip">
          {[
            { icon: 'bi-truck', title: 'Fast Delivery', desc: 'Nationwide across Kenya' },
            { icon: 'bi-shield-check', title: 'Secure Payments', desc: 'M-Pesa & PayPal' },
            { icon: 'bi-arrow-counterclockwise', title: 'Easy Returns', desc: '7-day return policy' },
            { icon: 'bi-headset', title: '24/7 Support', desc: 'Always here to help' },
          ].map((item) => (
            <div className="trust-item" key={item.title}>
              <div className="trust-item-icon">
                <i className={`bi ${item.icon}`}></i>
              </div>
              <div className="trust-item-text">
                <h6>{item.title}</h6>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Categories ───────────────────────────────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-accent"></span>
              Shop by Category
            </h2>
            <Link to="/store" className="section-view-all">
              All Categories <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <Link to={`/store?category=${cat.slug}`} key={cat.id} className="category-pill">
                <div className="category-pill-icon">
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} />
                    : <i className={`bi ${cat.icon}`}></i>
                  }
                </div>
                <span className="category-pill-label">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Flash Sales ──────────────────────────────────────────────── */}
        {flashSales.length > 0 && (
          <div className="flash-sale-section">
            <div className="flash-sale-header">
              <div className="flash-sale-brand">
                <div className="flash-sale-icon">
                  <i className="bi bi-lightning-charge-fill"></i>
                </div>
                <div>
                  <div className="flash-sale-title">Flash Sales</div>
                  <div className="flash-sale-subtitle">Limited-time deals — grab them before they're gone</div>
                </div>
              </div>

              {/* Countdown */}
              <div className="countdown-timer">
                <span className="countdown-label">Ends in</span>
                {[
                  { val: countdown.h, unit: 'HRS' },
                  { val: countdown.m, unit: 'MIN' },
                  { val: countdown.s, unit: 'SEC' },
                ].map(({ val, unit }, i) => (
                  <React.Fragment key={unit}>
                    {i > 0 && <span className="countdown-sep">:</span>}
                    <div className="countdown-block">
                      <div className="countdown-value">{val}</div>
                      <div className="countdown-unit">{unit}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <Link to="/store?is_flash_sale=true" className="section-view-all desktop-only">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            <ProductCarousel
              products={flashSales}
              viewAllLink="/store?is_flash_sale=true"
            />
          </div>
        )}

        {/* ── Promo Banners ─────────────────────────────────────────────── */}
        <div className="promo-banners">
          {[
            {
              to: '/store?category=electronics',
              tag: 'Best Deals',
              title: 'Electronics\nEssentials',
              sub: 'Phones, laptops & more',
              bg: 'linear-gradient(135deg, #1d3557 0%, #0f1c2e 100%)',
            },
            {
              to: '/store?category=fashion',
              tag: 'New Season',
              title: 'Fashion\nForward',
              sub: 'Style for every occasion',
              bg: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
            },
            {
              to: '/store?category=home-living',
              tag: 'Upgrade',
              title: 'Home &\nLiving',
              sub: 'Make your space shine',
              bg: 'linear-gradient(135deg, #f77f00 0%, #d67000 100%)',
            },
          ].map((b) => (
            <Link to={b.to} key={b.to} className="promo-banner">
              <div style={{ background: b.bg, position: 'absolute', inset: 0 }} />
              <div className="promo-banner-content">
                <div className="promo-banner-tag">{b.tag}</div>
                <div className="promo-banner-title" style={{ whiteSpace: 'pre-line' }}>{b.title}</div>
                <div className="promo-banner-sub">{b.sub}</div>
                <span className="btn btn-white btn-sm" style={{ width: 'fit-content' }}>
                  Shop <i className="bi bi-arrow-right"></i>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Featured Products ─────────────────────────────────────────── */}
        {featuredProducts.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-title-accent"></span>
                Featured Products
              </h2>
              <Link to="/store?is_featured=true" className="section-view-all">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <ProductCarousel
              products={featuredProducts}
              viewAllLink="/store?is_featured=true"
            />
          </div>
        )}

      </div>
    </>
  )
}

// ─── Static category data (replace with API fetch if available) ───────────────
const CATEGORIES = [
  { id: 1, name: 'Electronics',    slug: 'electronics',    icon: 'bi-phone',           image: null },
  { id: 2, name: 'Fashion',        slug: 'fashion',        icon: 'bi-bag',             image: null },
  { id: 3, name: 'Home & Living',  slug: 'home-living',    icon: 'bi-house',           image: null },
  { id: 4, name: 'Health & Beauty',slug: 'health-beauty',  icon: 'bi-heart-pulse',     image: null },
  { id: 5, name: 'Sports',         slug: 'sports',         icon: 'bi-bicycle',         image: null },
  { id: 6, name: 'Toys & Kids',    slug: 'toys',           icon: 'bi-controller',      image: null },
  { id: 7, name: 'Books',          slug: 'books',          icon: 'bi-book',            image: null },
  { id: 8, name: 'Groceries',      slug: 'groceries',      icon: 'bi-basket',          image: null },
]

export default Index