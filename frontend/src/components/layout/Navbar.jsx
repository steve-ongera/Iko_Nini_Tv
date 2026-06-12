import React, { useState } from 'react'
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

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Iko<span>Nini</span> TV
        </Link>

        <form onSubmit={handleSearch} className="navbar-search desktop-only">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <i className="bi bi-search"></i>
          </button>
        </form>

        <div className="navbar-links">
          <Link to="/store" className="nav-link desktop-only">
            <i className="bi bi-grid-3x3-gap-fill"></i> Store
          </Link>
          
          <Link to="/wishlist" className="nav-link wishlist-badge">
            <i className="bi bi-heart"></i>
            {wishlist.length > 0 && (
              <span className="wishlist-count">{wishlist.length}</span>
            )}
          </Link>
          
          <Link to="/cart" className="nav-link cart-badge">
            <i className="bi bi-cart"></i>
            {itemsCount > 0 && (
              <span className="cart-count">{itemsCount}</span>
            )}
          </Link>
          
          {isAuthenticated ? (
            <div className="dropdown desktop-only">
              <button className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle"></i> {user?.first_name}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link to="/account" className="dropdown-item">My Account</Link></li>
                <li><Link to="/orders" className="dropdown-item">My Orders</Link></li>
                <li><Link to="/wishlist" className="dropdown-item">Wishlist</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button onClick={logout} className="dropdown-item text-danger">Logout</button></li>
              </ul>
            </div>
          ) : (
            <div className="desktop-only">
              <Link to="/login" className="btn btn-outline-primary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm ms-2">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar