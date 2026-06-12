import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-dark text-white mt-5 py-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <h5 className="mb-3">Iko Nini TV</h5>
            <p className="text-muted">
              Kenya's premier e-commerce marketplace. Shop quality products with fast delivery 
              and secure payments via M-Pesa and PayPal.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="#" className="text-white"><i className="bi bi-facebook fs-4"></i></a>
              <a href="#" className="text-white"><i className="bi bi-twitter fs-4"></i></a>
              <a href="#" className="text-white"><i className="bi bi-instagram fs-4"></i></a>
              <a href="#" className="text-white"><i className="bi bi-whatsapp fs-4"></i></a>
            </div>
          </div>
          
          <div className="col-md-2">
            <h6 className="mb-3">Shop</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/store" className="text-muted text-decoration-none">All Products</Link></li>
              <li className="mb-2"><Link to="/store?is_flash_sale=true" className="text-muted text-decoration-none">Flash Sales</Link></li>
              <li className="mb-2"><Link to="/store?is_featured=true" className="text-muted text-decoration-none">Featured</Link></li>
            </ul>
          </div>
          
          <div className="col-md-2">
            <h6 className="mb-3">Account</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/account" className="text-muted text-decoration-none">My Account</Link></li>
              <li className="mb-2"><Link to="/orders" className="text-muted text-decoration-none">My Orders</Link></li>
              <li className="mb-2"><Link to="/wishlist" className="text-muted text-decoration-none">Wishlist</Link></li>
            </ul>
          </div>
          
          <div className="col-md-4">
            <h6 className="mb-3">Contact Info</h6>
            <ul className="list-unstyled text-muted">
              <li className="mb-2"><i className="bi bi-envelope me-2"></i> support@ikoninitv.co.ke</li>
              <li className="mb-2"><i className="bi bi-telephone me-2"></i> +254 700 123 456</li>
              <li className="mb-2"><i className="bi bi-geo-alt me-2"></i> Nairobi, Kenya</li>
            </ul>
            <div className="mt-3">
              <img src="/images/mpesa.png" alt="M-Pesa" height="30" className="me-2" />
              <img src="/images/paypal.png" alt="PayPal" height="30" />
            </div>
          </div>
        </div>
        
        <hr className="mt-4" />
        <div className="text-center text-muted">
          <small>&copy; 2024 Iko Nini TV. All rights reserved.</small>
        </div>
      </div>
    </footer>
  )
}

export default Footer