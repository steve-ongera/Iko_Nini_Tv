import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { productsAPI, bannersAPI, categoriesAPI, brandsAPI } from '../services/api'
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
            <p className="hero-slide-subtitle">{slide.subtitle}</p>
            {slide.price && <div className="hero-slide-price">{slide.price}</div>}
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
              <button key={i} className={`hero-dot ${i === active ? 'active' : ''}`}
                onClick={() => setActive(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Section Header helper ────────────────────────────────────────────────────
const SectionHeader = ({ title, icon, viewAllLink, viewAllLabel = 'View All' }) => (
  <div className="section-header" style={{ marginBottom: '1rem' }}>
    <h2 className="section-title">
      <span className="section-title-accent"></span>
      {icon && <i className={`bi ${icon} section-title-icon`}></i>}
      {title}
    </h2>
    {viewAllLink && (
      <Link to={viewAllLink} className="section-view-all">
        {viewAllLabel} <i className="bi bi-arrow-right"></i>
      </Link>
    )}
  </div>
)

// ─── Main Page ────────────────────────────────────────────────────────────────
const Index = () => {
  const [featuredProducts, setFeaturedProducts]   = useState([])
  const [flashSales, setFlashSales]               = useState([])
  const [newArrivals, setNewArrivals]             = useState([])
  const [topRated, setTopRated]                   = useState([])
  const [banners, setBanners]                     = useState([])
  const [categories, setCategories]               = useState([])
  const [brands, setBrands]                       = useState([])
  const [categoryProducts, setCategoryProducts]   = useState({}) // { slug: [products] }
  const [loading, setLoading]                     = useState(true)
  const countdown = useCountdown(8)

  useEffect(() => { fetchData() }, [])

  const toArray = (data) => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.results)) return data.results
    return []
  }

  const fetchData = async () => {
    try {
      // Phase 1 — critical above-fold data
      const [featuredRes, flashRes, bannersRes, newRes, ratedRes, catsRes, brandsRes] =
        await Promise.all([
          productsAPI.featured(),
          productsAPI.flashSales(),
          bannersAPI.list(),
          productsAPI.list({ is_new: true,      page_size: 10, ordering: '-created_at' }),
          // Change this line in fetchData phase 1:
          productsAPI.list({ ordering: '-avg_rating', page_size: 10 }),   
          categoriesAPI.list(),
          brandsAPI.list(),
        ])

      const cats   = toArray(catsRes.data).slice(0, 6)  // top 6 categories
      const brnds  = toArray(brandsRes.data).slice(0, 8) // top 8 brands

      setFeaturedProducts(toArray(featuredRes.data))
      setFlashSales(toArray(flashRes.data))
      setBanners(toArray(bannersRes.data))
      setNewArrivals(toArray(newRes.data))
      setTopRated(toArray(ratedRes.data))
      setCategories(cats)
      setBrands(brnds)

      // Phase 2 — per-category product rows (non-blocking)
      if (cats.length > 0) {
        const catFetches = await Promise.allSettled(
          cats.map(cat =>
            productsAPI.list({ category: cat.slug, page_size: 10 })
              .then(r => ({ slug: cat.slug, products: toArray(r.data) }))
          )
        )
        const catMap = {}
        catFetches.forEach(result => {
          if (result.status === 'fulfilled' && result.value.products.length > 0) {
            catMap[result.value.slug] = result.value.products
          }
        })
        setCategoryProducts(catMap)
      }

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
        <title>Iko Nini TV — Shop Smart, Live Better | Kenya's Online Marketplace</title>
        <meta name="description" content="Shop the best deals in Kenya on Iko Nini TV. Discover electronics, fashion, home goods, health & beauty products. Fast delivery, M-Pesa payments, and 7-day returns." />
        <meta name="keywords" content="online shopping Kenya, buy electronics Nairobi, fashion Kenya, M-Pesa shopping, flash sales Kenya, Iko Nini TV" />

        {/* Open Graph */}
        <meta property="og:title" content="Iko Nini TV — Kenya's Premier Online Marketplace" />
        <meta property="og:description" content="Shop electronics, fashion, home goods and more. Fast delivery across Kenya, secure M-Pesa payments." />
        <meta property="og:image" content="/images/og-image.jpg" />
        <meta property="og:url" content="https://ikoninitv.co.ke" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Iko Nini TV" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Iko Nini TV — Shop Smart, Live Better" />
        <meta name="twitter:description" content="Kenya's premier e-commerce marketplace. M-Pesa payments, fast delivery." />
        <meta name="twitter:image" content="/images/og-image.jpg" />

        {/* Structured data — Organization */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Iko Nini TV",
          "url": "https://ikoninitv.co.ke",
          "logo": "https://ikoninitv.co.ke/images/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+254700123456",
            "contactType": "customer service",
            "areaServed": "KE",
            "availableLanguage": ["English", "Swahili"]
          },
          "sameAs": [
            "https://facebook.com/ikoninitv",
            "https://instagram.com/ikoninitv",
            "https://twitter.com/ikoninitv"
          ]
        })}</script>

        {/* Structured data — WebSite with SearchAction */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Iko Nini TV",
          "url": "https://ikoninitv.co.ke",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://ikoninitv.co.ke/store?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}</script>
      </Helmet>

      <div className="container">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="hero-section" style={{ paddingTop: '1rem' }}>
          <HeroSlider banners={banners} />
          <div className="hero-sidebar">
            <Link to="/store?is_flash_sale=true" className="hero-mini-banner">
              <div style={{ background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)', position: 'absolute', inset: 0 }} />
              <div className="hero-mini-banner-overlay">
                <div className="hero-mini-banner-title">Flash Sales</div>
                <div className="hero-mini-banner-sub">Up to 60% off today</div>
              </div>
            </Link>
            <Link to="/store?is_new=true" className="hero-mini-banner">
              <div style={{ background: 'linear-gradient(135deg, #1d3557 0%, #2b4a7a 100%)', position: 'absolute', inset: 0 }} />
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
            { icon: 'bi-truck',                title: 'Fast Delivery',    desc: 'Nationwide across Kenya' },
            { icon: 'bi-shield-check',          title: 'Secure Payments',  desc: 'M-Pesa & PayPal' },
            { icon: 'bi-arrow-counterclockwise',title: 'Easy Returns',     desc: '7-day return policy' },
            { icon: 'bi-headset',               title: '24/7 Support',     desc: 'Always here to help' },
          ].map(item => (
            <div className="trust-item" key={item.title}>
              <div className="trust-item-icon"><i className={`bi ${item.icon}`}></i></div>
              <div className="trust-item-text"><h6>{item.title}</h6><p>{item.desc}</p></div>
            </div>
          ))}
        </div>

        {/* ── Categories ───────────────────────────────────────────────── */}
        <div className="section">
          <SectionHeader title="Shop by Category" viewAllLink="/store" viewAllLabel="All Categories" />
          <div className="category-pills">
            {CATEGORIES.map(cat => (
              <Link to={`/store?category=${cat.slug}`} key={cat.id} className="category-pill">
                <div className="category-pill-icon">
                  {cat.image ? <img src={cat.image} alt={cat.name} /> : <i className={`bi ${cat.icon}`}></i>}
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
            <ProductCarousel products={flashSales} viewAllLink="/store?is_flash_sale=true" />
          </div>
        )}

        {/* ── Promo Banners row 1 ───────────────────────────────────────── */}
        <div className="promo-banners">
          {[
            { to: '/store?category=electronics', tag: 'Best Deals',  title: 'Electronics\nEssentials', sub: 'Phones, laptops & more',     bg: 'linear-gradient(135deg, #1d3557 0%, #0f1c2e 100%)' },
            { to: '/store?category=fashion',     tag: 'New Season',  title: 'Fashion\nForward',        sub: 'Style for every occasion',    bg: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)' },
            { to: '/store?category=home-living', tag: 'Upgrade',     title: 'Home &\nLiving',          sub: 'Make your space shine',        bg: 'linear-gradient(135deg, #f77f00 0%, #d67000 100%)' },
          ].map(b => (
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
            <SectionHeader title="Featured Products" icon="bi-star-fill" viewAllLink="/store?is_featured=true" />
            <ProductCarousel products={featuredProducts} viewAllLink="/store?is_featured=true" />
          </div>
        )}

        {/* ── New Arrivals ─────────────────────────────────────────────── */}
        {newArrivals.length > 0 && (
          <div className="section">
            <SectionHeader title="New Arrivals" icon="bi-bag-plus" viewAllLink="/store?is_new=true" />
            <ProductCarousel products={newArrivals} viewAllLink="/store?is_new=true" />
          </div>
        )}

        {/* ── Promo Banner row 2 ────────────────────────────────────────── */}
        <div className="promo-banners" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {[
            { to: '/store?category=health-beauty', tag: 'Self Care',    title: 'Health &\nBeauty',    sub: 'Look & feel your best',       bg: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)' },
            { to: '/store?category=sports',        tag: 'Active Life',  title: 'Sports &\nFitness',   sub: 'Gear up and go harder',       bg: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
          ].map(b => (
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

        {/* ── Top Rated ─────────────────────────────────────────────────── */}
        {topRated.length > 0 && (
          <div className="section">
            <SectionHeader title="Top Rated" icon="bi-trophy" viewAllLink="/store?ordering=-average_rating" />
            <ProductCarousel products={topRated} viewAllLink="/store?ordering=-average_rating" />
          </div>
        )}

        {/* ── Per-category product rows ─────────────────────────────────── */}
        {CATEGORIES.map(cat => {
          const products = categoryProducts[cat.slug]
          if (!products || products.length === 0) return null
          return (
            <div className="section" key={cat.slug}>
              <SectionHeader
                title={cat.name}
                icon={cat.icon}
                viewAllLink={`/store?category=${cat.slug}`}
                viewAllLabel={`More ${cat.name}`}
              />
              <ProductCarousel
                products={products}
                viewAllLink={`/store?category=${cat.slug}`}
              />
            </div>
          )
        })}

        {/* ── Shop by Brand ─────────────────────────────────────────────── */}
        {brands.length > 0 && (
          <div className="section">
            <SectionHeader title="Shop by Brand" icon="bi-award" viewAllLink="/store" viewAllLabel="All Brands" />
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'none',
            }}>
              {brands.map(brand => (
                <Link
                  key={brand.id}
                  to={`/store?brand=${brand.slug}`}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1.25rem',
                    background: 'white',
                    border: '1.5px solid var(--gray-150)',
                    borderRadius: 'var(--radius-lg)',
                    minWidth: '110px',
                    textDecoration: 'none',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--brand-red)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--gray-150)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      style={{ height: '36px', objectFit: 'contain', maxWidth: '80px' }}
                    />
                  ) : (
                    <div style={{
                      width: '40px', height: '40px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--brand-red-pale)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--brand-red)', fontSize: '1.25rem',
                    }}>
                      <i className="bi bi-award"></i>
                    </div>
                  )}
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--gray-700)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}>
                    {brand.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Promo Banner row 3 ────────────────────────────────────────── */}
        <div className="promo-banners" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { to: '/store?category=toys',      tag: 'Kids Corner',   title: 'Toys &\nKids',        sub: 'Fun for every age',           bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
            { to: '/store?category=groceries', tag: 'Pantry',        title: 'Groceries &\nFood',   sub: 'Daily essentials delivered',  bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
            { to: '/store?category=books',     tag: 'Knowledge',     title: 'Books &\nMedia',      sub: 'Feed your mind',              bg: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)' },
          ].map(b => (
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

        {/* ── Why Shop With Us ──────────────────────────────────────────── */}
        <div className="section">
          <SectionHeader title="Why Shop with Iko Nini TV?" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { icon: 'bi-phone',               title: 'M-Pesa Payments',    desc: 'Pay instantly via Lipa na M-Pesa. Safe, fast, and trusted.' },
              { icon: 'bi-truck',               title: 'Fast Delivery',       desc: 'Same-day Nairobi, 3–5 days nationwide. Track every step.' },
              { icon: 'bi-arrow-counterclockwise', title: '7-Day Returns',    desc: 'Not happy? Return it hassle-free within 7 days.' },
              { icon: 'bi-shield-check',        title: 'Verified Sellers',    desc: 'Every seller is vetted. Shop with total confidence.' },
              { icon: 'bi-headset',             title: '24/7 Support',        desc: 'Real humans ready to help you any time of day.' },
              { icon: 'bi-tag',                 title: 'Best Prices',         desc: 'Price-match guarantee. Get the best deal, always.' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'white',
                border: '1px solid var(--gray-150)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}>
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--brand-red-pale)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--brand-red)', fontSize: '1.375rem',
                }}>
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--gray-900)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}

// ─── Static category data ─────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, name: 'Electronics',     slug: 'electronics',    icon: 'bi-phone',        image: null },
  { id: 2, name: 'Fashion',         slug: 'fashion',        icon: 'bi-bag',          image: null },
  { id: 3, name: 'Home & Living',   slug: 'home-living',    icon: 'bi-house',        image: null },
  { id: 4, name: 'Health & Beauty', slug: 'health-beauty',  icon: 'bi-heart-pulse',  image: null },
  { id: 5, name: 'Sports',          slug: 'sports',         icon: 'bi-bicycle',      image: null },
  { id: 6, name: 'Toys & Kids',     slug: 'toys',           icon: 'bi-controller',   image: null },
  { id: 7, name: 'Books',           slug: 'books',          icon: 'bi-book',         image: null },
  { id: 8, name: 'Groceries',       slug: 'groceries',      icon: 'bi-basket',       image: null },
]

export default Index