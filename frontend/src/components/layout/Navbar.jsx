import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { categoriesAPI } from '../../services/api'

const ANNOUNCEMENT_HEIGHT = '32px'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemsCount } = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery]           = useState('')
  const [accountOpen, setAccountOpen]           = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [announcementVisible, setAnnouncementVisible] = useState(true)
  const [categories, setCategories]             = useState([])
  const [megaOpen, setMegaOpen]                 = useState(false)

  const accountRef   = useRef(null)
  const mobileSearchRef = useRef(null)
  const megaRef      = useRef(null)

  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0

  const announcementH = announcementVisible ? ANNOUNCEMENT_HEIGHT : '0px'
  const navTop        = announcementH
  const subnavTop     = `calc(${announcementH} + var(--nav-height))`
  const mainTop       = `calc(${announcementH} + var(--total-nav-height))`

  // ── Fetch categories once ────────────────────────────────────────────
  useEffect(() => {
    categoriesAPI.list()
      .then(res => {
        const data = res.data
        const arr = Array.isArray(data) ? data
          : Array.isArray(data.results) ? data.results
          : []
        setCategories(arr.slice(0, 10)) // cap at 10 for subnav
      })
      .catch(() => setCategories([]))
  }, [])

  // ── Inject CSS variables ─────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--announcement-h',        announcementH)
    root.style.setProperty('--effective-nav-top',     navTop)
    root.style.setProperty('--effective-subnav-top',  subnavTop)
    root.style.setProperty('--effective-main-top',    mainTop)
  }, [announcementVisible])

  // ── Close dropdowns on outside click ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) setMobileSearchOpen(false)
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Close mega menu on route change ─────────────────────────────────
  useEffect(() => { setMegaOpen(false) }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setMobileSearchOpen(false)
    }
  }

  // Fallback static categories while API loads
  const STATIC_CATS = [
    { name: 'Electronics',     slug: 'electronics' },
    { name: 'Fashion',         slug: 'fashion' },
    { name: 'Home & Living',   slug: 'home-living' },
    { name: 'Health & Beauty', slug: 'health-beauty' },
    { name: 'Sports',          slug: 'sports' },
    { name: 'Toys & Kids',     slug: 'toys' },
    { name: 'Groceries',       slug: 'groceries' },
    { name: 'Books',           slug: 'books' },
  ]

  const navCategories = categories.length > 0 ? categories : STATIC_CATS

  return (
    <>
      {/* ── Announcement bar ──────────────────────────────────────────── */}
      {announcementVisible && (
        <div
          className="announcement-bar"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            height: ANNOUNCEMENT_HEIGHT,
            zIndex: 'calc(var(--z-fixed) + 10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          🚚 Free delivery on orders over <strong style={{ margin: '0 0.25rem' }}>KSh 2,000</strong>
          &nbsp;·&nbsp; Pay via M-Pesa, PayPal & card
          <Link to="/store?is_flash_sale=true" style={{ color: 'var(--brand-orange)', marginLeft: '0.5rem', fontWeight: 600 }}>
            Shop Flash Sales →
          </Link>
          <button
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Dismiss"
            style={{
              position: 'absolute', right: '1rem',
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              fontSize: '0.875rem', lineHeight: 1,
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {/* ── Main navbar ───────────────────────────────────────────────── */}
      <nav className="navbar" style={{ top: navTop, transition: 'top 0.2s ease' }}>
        <div className="navbar-container">

          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <div className="navbar-brand-logo">
              <span className="navbar-brand-main">Iko<span>Nini</span> TV</span>
              <span className="navbar-brand-tag desktop-only">Kenya's Marketplace</span>
            </div>
          </Link>

          {/* Location — desktop */}
          <div className="navbar-location desktop-only">
            <i className="bi bi-geo-alt-fill"></i>
            <div className="navbar-location-label">
              <span>Deliver to</span>
              <span>Nairobi</span>
            </div>
          </div>

          {/* Search — desktop */}
          <div className="navbar-search desktop-only">
            <form onSubmit={handleSearch} className="navbar-search-inner">
              <div className="navbar-search-category">
                All <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
              </div>
              <input
                type="text"
                className="navbar-search-input"
                placeholder="Search products, brands & categories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="navbar-search-btn">
                <i className="bi bi-search"></i>
              </button>
            </form>
          </div>

          {/* Right actions */}
          <div className="navbar-actions">

            {/* Mobile search toggle */}
            <button
              className="nav-icon-btn mobile-only"
              onClick={() => setMobileSearchOpen(o => !o)}
              aria-label="Search"
              style={{ background: 'none', border: 'none' }}
            >
              <i className={`bi ${mobileSearchOpen ? 'bi-x-lg' : 'bi-search'}`}></i>
              <span className="nav-icon-btn-label">Search</span>
            </button>

            {/* Account — desktop */}
            {isAuthenticated ? (
              <div className="account-dropdown-wrapper desktop-only" ref={accountRef}>
                <div className="nav-account" onClick={() => setAccountOpen(o => !o)}>
                  <div className="nav-account-icon">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div className="nav-account-info">
                    <span>Hello,</span>
                    <span>{user?.first_name || 'Account'}</span>
                  </div>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}></i>
                </div>

                <div className={`account-dropdown ${accountOpen ? 'open' : ''}`}>
                  <div className="account-dropdown-header">
                    <div className="user-avatar">
                      {(user?.first_name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="user-name">{user?.first_name} {user?.last_name}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                  <Link to="/account" className="dropdown-menu-item" onClick={() => setAccountOpen(false)}>
                    <i className="bi bi-person"></i> My Account
                  </Link>
                  <Link to="/orders" className="dropdown-menu-item" onClick={() => setAccountOpen(false)}>
                    <i className="bi bi-bag"></i> My Orders
                  </Link>
                  <Link to="/wishlist" className="dropdown-menu-item" onClick={() => setAccountOpen(false)}>
                    <i className="bi bi-heart"></i> Wishlist
                    {wishlistCount > 0 && (
                      <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{wishlistCount}</span>
                    )}
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-menu-item danger"
                    style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => { logout(); setAccountOpen(false) }}
                  >
                    <i className="bi bi-box-arrow-right"></i> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="nav-account desktop-only">
                <div className="nav-account-icon"><i className="bi bi-person"></i></div>
                <div className="nav-account-info">
                  <span>Welcome</span>
                  <span>
                    <Link to="/login" style={{ color: 'white', marginRight: '0.25rem' }}>Sign In</Link>
                    /
                    <Link to="/register" style={{ color: 'white', marginLeft: '0.25rem' }}>Register</Link>
                  </span>
                </div>
              </div>
            )}

            <div className="nav-divider desktop-only"></div>

            {/* Wishlist — desktop */}
            <Link to="/wishlist" className="nav-icon-btn desktop-only">
              <i className="bi bi-heart"></i>
              <span className="nav-icon-btn-label">Wishlist</span>
              {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="nav-icon-btn">
              <i className="bi bi-cart2"></i>
              <span className="nav-icon-btn-label">Cart</span>
              {itemsCount > 0 && <span className="nav-badge">{itemsCount}</span>}
            </Link>

          </div>
        </div>

        {/* Mobile search slide-down */}
        <div
          ref={mobileSearchRef}
          style={{
            maxHeight: mobileSearchOpen ? '64px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease',
            background: 'var(--brand-red)',
          }}
        >
          <div style={{ padding: '0.625rem 1rem' }}>
            <form onSubmit={handleSearch} className="navbar-search-inner">
              <input
                type="text"
                className="navbar-search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus={mobileSearchOpen}
              />
              <button type="submit" className="navbar-search-btn">
                <i className="bi bi-search"></i>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* ── Sub navbar ────────────────────────────────────────────────── */}
      <div
        className="subnav desktop-only"
        style={{ top: subnavTop, transition: 'top 0.2s ease' }}
        ref={megaRef}
      >
        <div className="subnav-container">

          {/* All categories trigger */}
          <div
            className="subnav-all-categories"
            onClick={() => setMegaOpen(o => !o)}
            style={{ userSelect: 'none' }}
          >
            <i className={`bi ${megaOpen ? 'bi-x' : 'bi-list'}`}></i>
            All Categories
          </div>

          {/* Category links — from API */}
          <div className="subnav-links">
            {navCategories.map(cat => (
              <Link
                key={cat.slug || cat.id}
                to={`/store?category=${cat.slug}`}
                className="subnav-link"
              >
                {cat.name}
              </Link>
            ))}

            <Link to="/store?is_flash_sale=true" className="subnav-link">
              <span style={{ color: 'var(--brand-orange)', fontWeight: 700 }}>
                ⚡ Flash Sales
              </span>
              <span className="subnav-link-badge flash">HOT</span>
            </Link>
          </div>

          {/* Right extras */}
          <div className="subnav-extras">
            {/* ← View All Products */}
            <Link to="/store" className="subnav-extra-link">
              <i className="bi bi-grid-3x3-gap"></i> All Products
            </Link>
            <Link to="/store?is_new=true" className="subnav-extra-link">
              <i className="bi bi-stars"></i> New Arrivals
            </Link>
            <Link to="/orders" className="subnav-extra-link">
              <i className="bi bi-bag-check"></i> Track Order
            </Link>
          </div>

        </div>

        {/* ── Mega menu ──────────────────────────────────────────────── */}
        {megaOpen && (
          <div
            className="mega-menu open"
            style={{ top: `calc(${subnavTop} + var(--subnav-height))` }}
          >
            <div className="mega-menu-container">

              {/* Category list */}
              <div className="mega-menu-categories">
                {navCategories.map(cat => (
                  <Link
                    key={cat.slug || cat.id}
                    to={`/store?category=${cat.slug}`}
                    className="mega-menu-cat-item"
                    onClick={() => setMegaOpen(false)}
                  >
                    {cat.icon && <i className={`bi ${cat.icon}`} style={{ marginRight: '0.5rem', color: 'var(--brand-red)' }}></i>}
                    {cat.name}
                    <i className="bi bi-chevron-right" style={{ fontSize: '0.7rem', opacity: 0.4 }}></i>
                  </Link>
                ))}

                {/* View all at bottom of list */}
                <Link
                  to="/store"
                  className="mega-menu-cat-item"
                  onClick={() => setMegaOpen(false)}
                  style={{ marginTop: '0.5rem', borderTop: '1px solid var(--gray-150)', paddingTop: '0.75rem', color: 'var(--brand-red)', fontWeight: 700 }}
                >
                  <i className="bi bi-grid-3x3-gap" style={{ marginRight: '0.5rem' }}></i>
                  View All Products
                  <i className="bi bi-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                </Link>
              </div>

              {/* Promo tiles */}
              <div className="mega-menu-subcats">
                {[
                  { to: '/store?is_flash_sale=true', label: '⚡ Flash Sales',   sub: 'Up to 60% off',             bg: 'var(--brand-red)' },
                  { to: '/store?is_featured=true',   label: '★ Featured',       sub: 'Handpicked for you',        bg: 'var(--brand-navy)' },
                  { to: '/store?is_new=true',         label: '✦ New Arrivals',   sub: 'Fresh drops',               bg: '#10b981' },
                  { to: '/store?ordering=-sold_count',label: '🔥 Best Sellers',  sub: 'Most popular right now',    bg: 'var(--brand-orange)' },
                ].map(tile => (
                  <Link
                    key={tile.to}
                    to={tile.to}
                    onClick={() => setMegaOpen(false)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      background: tile.bg,
                      minHeight: '100px',
                      textDecoration: 'none',
                      transition: 'var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 'var(--text-sm)' }}>
                      {tile.label}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.75)', marginTop: '0.125rem' }}>
                      {tile.sub}
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ── Global offset styles ──────────────────────────────────────── */}
      <style>{`
        .main-content {
          margin-top: ${mainTop} !important;
        }
        .mega-menu {
          top: calc(${subnavTop} + var(--subnav-height)) !important;
        }
        @media (max-width: 768px) {
          .main-content {
            margin-top: var(--nav-height) !important;
          }
        }
      `}</style>
    </>
  )
}

export default Navbar