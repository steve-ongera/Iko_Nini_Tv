import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemsCount } = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-logo">
            <span className="navbar-brand-main">
              Iko<span>Nini</span> TV
            </span>
            <span className="navbar-brand-tag">Kenya's Marketplace</span>
          </div>
        </Link>

        {/* Delivery location — desktop */}
        <div className="navbar-location desktop-only">
          <i className="bi bi-geo-alt-fill"></i>
          <div className="navbar-location-label">
            <span>Deliver to</span>
            <span>Nairobi</span>
          </div>
        </div>

        {/* Search */}
        <div className="navbar-search">
          <form onSubmit={handleSearch} className="navbar-search-inner">
            <div className="navbar-search-category desktop-only">
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

          {/* Account */}
          {isAuthenticated ? (
            <div className="account-dropdown-wrapper desktop-only" ref={accountRef}>
              <div
                className="nav-account"
                onClick={() => setAccountOpen((o) => !o)}
              >
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
                  {wishlist.length > 0 && (
                    <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{wishlist.length}</span>
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
            <div className="nav-account desktop-only" style={{ gap: '0.5rem' }}>
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

          {/* Wishlist */}
          <Link to="/wishlist" className="nav-icon-btn">
            <i className="bi bi-heart"></i>
            <span className="nav-icon-btn-label">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="nav-badge">{wishlist.length}</span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" className="nav-icon-btn">
            <i className="bi bi-cart2"></i>
            <span className="nav-icon-btn-label">Cart</span>
            {itemsCount > 0 && (
              <span className="nav-badge">{itemsCount}</span>
            )}
          </Link>

        </div>
      </div>
    </nav>
  )
}

export default Navbar