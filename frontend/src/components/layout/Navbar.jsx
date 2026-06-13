import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'

const ANNOUNCEMENT_HEIGHT = '32px'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemsCount } = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [announcementVisible, setAnnouncementVisible] = useState(true)
  const accountRef = useRef(null)
  const mobileSearchRef = useRef(null)

  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0

  // Dynamically compute offsets based on announcement bar visibility
  const announcementH = announcementVisible ? ANNOUNCEMENT_HEIGHT : '0px'
  const navTop        = announcementH
  const subnavTop     = `calc(${announcementH} + var(--nav-height))`
  const mainTop       = `calc(${announcementH} + var(--total-nav-height))`

  // Inject CSS variables into :root so sidebar, sticky panels etc. stay correct
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--announcement-h', announcementH)
    root.style.setProperty('--effective-nav-top',    navTop)
    root.style.setProperty('--effective-subnav-top', subnavTop)
    root.style.setProperty('--effective-main-top',   mainTop)
  }, [announcementVisible])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setMobileSearchOpen(false)
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      {/* ── Announcement bar ──────────────────────────────────────────── */}
      {announcementVisible && (
        <div
          className="announcement-bar"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: ANNOUNCEMENT_HEIGHT,
            zIndex: 'calc(var(--z-fixed) + 10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🚚 Free delivery on orders over <strong style={{ margin: '0 0.25rem' }}>KSh 2,000</strong>
          &nbsp;·&nbsp; Pay via M-Pesa, PayPal & card
          <a href="/store?is_flash_sale=true"> Shop Flash Sales →</a>

          {/* Dismiss */}
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
      <nav
        className="navbar"
        style={{ top: navTop, transition: 'top 0.2s ease' }}
      >
        <div className="navbar-container">

          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <div className="navbar-brand-logo">
              <span className="navbar-brand-main">
                Iko<span>Nini</span> TV
              </span>
              <span className="navbar-brand-tag desktop-only">Kenya's Marketplace</span>
            </div>
          </Link>

          {/* Delivery location — desktop only */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Account dropdown — desktop */}
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
                  <i className="bi bi-chevron-down"
                    style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}></i>
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
                      <span className="badge badge-red" style={{ marginLeft: 'auto' }}>
                        {wishlistCount}
                      </span>
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
                <div className="nav-account-icon">
                  <i className="bi bi-person"></i>
                </div>
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

            {/* Cart — always visible */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
      >
        <div className="subnav-container">

          <div className="subnav-all-categories">
            <i className="bi bi-list"></i>
            All Categories
          </div>

          <div className="subnav-links">
            {[
              { label: 'Electronics',     slug: 'electronics' },
              { label: 'Fashion',         slug: 'fashion' },
              { label: 'Home & Living',   slug: 'home-living' },
              { label: 'Health & Beauty', slug: 'health-beauty' },
              { label: 'Sports',          slug: 'sports' },
              { label: 'Toys & Kids',     slug: 'toys' },
              { label: 'Groceries',       slug: 'groceries' },
              { label: 'Books',           slug: 'books' },
            ].map(cat => (
              <Link
                key={cat.slug}
                to={`/store?category=${cat.slug}`}
                className="subnav-link"
              >
                {cat.label}
              </Link>
            ))}

            <Link to="/store?is_flash_sale=true" className="subnav-link">
              <span style={{ color: 'var(--brand-orange)', fontWeight: 700 }}>
                ⚡ Flash Sales
              </span>
              <span className="subnav-link-badge flash">HOT</span>
            </Link>
          </div>

          <div className="subnav-extras">
            <Link to="/store?is_new=true" className="subnav-extra-link">
              <i className="bi bi-stars"></i> New Arrivals
            </Link>
            <Link to="/orders" className="subnav-extra-link">
              <i className="bi bi-bag-check"></i> Track Order
            </Link>
          </div>

        </div>
      </div>

      {/* ── Global offset style ───────────────────────────────────────── */}
      {/* Keeps .main-content, sticky sidebars, and dropdowns correctly 
          offset whenever the announcement bar is shown or dismissed */}
      <style>{`
        .main-content {
          margin-top: ${mainTop} !important;
        }
        .mega-menu {
          top: ${subnavTop} !important;
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