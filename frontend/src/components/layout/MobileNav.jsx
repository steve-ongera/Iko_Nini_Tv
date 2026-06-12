import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'

const MobileNav = () => {
  const location = useLocation()
  const { itemsCount } = useCart()
  const { wishlist } = useWishlist()
  
  const navItems = [
    { path: '/', icon: 'bi-house-door', label: 'Home' },
    { path: '/store', icon: 'bi-grid-3x3-gap', label: 'Store' },
    { path: '/wishlist', icon: 'bi-heart', label: 'Wishlist', badge: wishlist.length },
    { path: '/cart', icon: 'bi-cart', label: 'Cart', badge: itemsCount },
    { path: '/account', icon: 'bi-person', label: 'Account' },
  ]

  return (
    <div className="mobile-nav">
      <div className="mobile-nav-items">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <div style={{ position: 'relative' }}>
              <i className={item.icon}></i>
              {item.badge > 0 && (
                <span className="cart-count" style={{ top: '-8px', right: '-12px' }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default MobileNav