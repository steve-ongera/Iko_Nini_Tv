import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'

const MobileNav = () => {
  const location = useLocation()
  const { itemsCount } = useCart()
  const { wishlist } = useWishlist()
  const { isAuthenticated, user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0

  const NAV_ITEMS = [
    { path: '/',        icon: 'bi-house-door',    activeIcon: 'bi-house-door-fill', label: 'Home' },
    { path: '/store',   icon: 'bi-grid-3x3-gap',  activeIcon: 'bi-grid-3x3-gap-fill', label: 'Store' },
    { path: '/wishlist',icon: 'bi-heart',          activeIcon: 'bi-heart-fill', label: 'Wishlist', badge: wishlistCount },
    { path: '/account', icon: 'bi-person',         activeIcon: 'bi-person-fill', label: 'Account' },
  ]

  const DRAWER_LINKS = [
    { to: '/store',                label: 'All Products',    icon: 'bi-grid-3x3-gap' },
    { to: '/store?is_flash_sale=true', label: 'Flash Sales', icon: 'bi-lightning-charge' },
    { to: '/store?is_featured=true',   label: 'Featured',   icon: 'bi-star' },
    { to: '/orders',               label: 'My Orders',       icon: 'bi-bag' },
    { to: '/wishlist',             label: 'Wishlist',        icon: 'bi-heart' },
    { to: '/account',              label: 'My Account',      icon: 'bi-person' },
  ]

  return (
    <>
      {/* ── Bottom nav bar ──────────────────────────────────────────────── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">

          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <i className={`bi ${isActive(item.path) ? item.activeIcon : item.icon}`}></i>
              {item.badge > 0 && (
                <span className="mobile-nav-badge">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Cart — centre elevated button */}
          <div className="mobile-nav-center">
            <Link to="/cart" className="mobile-nav-center-btn" aria-label="Cart">
              <i className="bi bi-cart2"></i>
              {itemsCount > 0 && (
                <span className="mobile-nav-badge" style={{ top: '2px', right: '2px' }}>
                  {itemsCount > 9 ? '9+' : itemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Menu — opens drawer */}
          <button
            className={`mobile-nav-item ${drawerOpen ? 'active' : ''}`}
            onClick={() => setDrawerOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Menu"
          >
            <i className={`bi ${drawerOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
            <span>Menu</span>
          </button>

        </div>
      </nav>

      {/* ── Drawer backdrop ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 'calc(var(--z-fixed) + 1)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Drawer panel ────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 'min(300px, 85vw)',
        background: 'white',
        zIndex: 'calc(var(--z-fixed) + 2)',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
      }}>

        {/* Drawer header */}
        <div style={{
          background: 'var(--brand-red)',
          padding: '1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.375rem',
            color: 'white',
            letterSpacing: '-0.03em',
            textDecoration: 'none',
          }}>
            Iko<span style={{ color: 'rgba(255,255,255,0.65)' }}>Nini</span> TV
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 'var(--radius)',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer', fontSize: '1rem',
            }}
            aria-label="Close menu"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* User section */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--gray-150)',
          background: 'var(--gray-50)',
          flexShrink: 0,
        }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--brand-red)',
                color: 'white', fontWeight: 700,
                fontFamily: 'var(--font-display)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-base)', flexShrink: 0,
              }}>
                {[user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 'var(--text-sm)',
                  color: 'var(--gray-900)', fontFamily: 'var(--font-display)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)', color: 'var(--gray-500)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.email}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <Link to="/login"    className="btn btn-outline-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm"         style={{ flex: 1, textAlign: 'center' }}>Register</Link>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {DRAWER_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="dropdown-menu-item"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: location.pathname === link.to.split('?')[0]
                  ? 'var(--brand-red-pale)' : 'transparent',
                color: location.pathname === link.to.split('?')[0]
                  ? 'var(--brand-red)' : 'var(--gray-700)',
                fontWeight: location.pathname === link.to.split('?')[0] ? 600 : 400,
              }}
            >
              <i className={`bi ${link.icon}`}
                style={{
                  color: location.pathname === link.to.split('?')[0]
                    ? 'var(--brand-red)' : 'var(--gray-400)'
                }}
              ></i>
              {link.label}
              {link.to === '/wishlist' && wishlistCount > 0 && (
                <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{wishlistCount}</span>
              )}
              {link.to === '/cart' && itemsCount > 0 && (
                <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{itemsCount}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Drawer footer */}
        <div style={{
          padding: '0.75rem 0.5rem',
          borderTop: '1px solid var(--gray-150)',
          flexShrink: 0,
        }}>
          {isAuthenticated ? (
            <button
              onClick={() => { logout(); setDrawerOpen(false) }}
              className="dropdown-menu-item danger"
              style={{
                width: '100%', background: 'none', border: 'none',
                textAlign: 'left', cursor: 'pointer',
                borderRadius: 'var(--radius)',
              }}
            >
              <i className="bi bi-box-arrow-right"></i> Sign Out
            </button>
          ) : null}

          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: 'var(--text-xs)',
            color: 'var(--gray-400)',
            textAlign: 'center',
          }}>
            &copy; {new Date().getFullYear()} Iko Nini TV
          </div>
        </div>

      </div>
    </>
  )
}

export default MobileNav