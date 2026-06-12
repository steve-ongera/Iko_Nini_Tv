import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/product/ProductCard'
import Loader from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (loading) {
    return <Loader />
  }

  if (wishlist.length === 0) {
    return (
      <EmptyState
        title="Your Wishlist is Empty"
        message="Save items you love to your wishlist and come back to them later."
        icon="bi-heart"
        actionText="Start Shopping"
        actionLink="/store"
      />
    )
  }

  const handleMoveToCart = async (product) => {
    await addToCart(product.id, null, 1)
    // Optionally remove from wishlist
    // await removeFromWishlist(wishlistItem.id)
  }

  return (
    <>
      <Helmet>
        <title>My Wishlist - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <h2 className="mb-4">My Wishlist ({wishlist.length} items)</h2>

        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="list-group">
              <Link to="/account" className="list-group-item list-group-item-action">
                <i className="bi bi-person me-2"></i> Profile
              </Link>
              <Link to="/orders" className="list-group-item list-group-item-action">
                <i className="bi bi-box-seam me-2"></i> Orders
              </Link>
              <Link to="/wishlist" className="list-group-item list-group-item-action active">
                <i className="bi bi-heart me-2"></i> Wishlist
              </Link>
              <Link to="/account/addresses" className="list-group-item list-group-item-action">
                <i className="bi bi-geo-alt me-2"></i> Addresses
              </Link>
            </div>
          </div>

          <div className="col-lg-9">
            <div className="row g-4">
              {wishlist.map(item => (
                <div key={item.id} className="col-md-6 col-lg-4">
                  <div className="card h-100">
                    <ProductCard product={item.product} />
                    <div className="card-footer bg-transparent border-0 pb-3 pt-0">
                      <button
                        onClick={() => handleMoveToCart(item.product)}
                        className="btn btn-outline-primary w-100"
                      >
                        <i className="bi bi-cart-plus"></i> Move to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Wishlist