import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const [email, setEmail] = useState('')

  const handleNewsletter = (e) => {
    e.preventDefault()
    // Hook up to your newsletter API
    setEmail('')
  }

  return (
    <footer className="footer">

      {/* Trust strip */}
      <div className="footer-top">
        <div className="footer-top-inner">
          <div className="footer-top-item">
            <i className="bi bi-truck"></i>
            <span><strong>Free Delivery</strong> on orders over KSh 2,000</span>
          </div>
          <div className="footer-top-sep desktop-only"></div>
          <div className="footer-top-item">
            <i className="bi bi-shield-check"></i>
            <span><strong>Secure Payments</strong> M-Pesa & PayPal</span>
          </div>
          <div className="footer-top-sep desktop-only"></div>
          <div className="footer-top-item">
            <i className="bi bi-arrow-counterclockwise"></i>
            <span><strong>Easy Returns</strong> 7-day return policy</span>
          </div>
          <div className="footer-top-sep desktop-only"></div>
          <div className="footer-top-item">
            <i className="bi bi-headset"></i>
            <span><strong>24/7 Support</strong> Always here to help</span>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="footer-main">
        <div className="footer-main-grid">

          {/* Brand column */}
          <div className="footer-brand">
            <div className="footer-logo">Iko<span>Nini</span> TV</div>
            <p className="footer-tagline">
              Kenya's premier e-commerce marketplace. Shop quality products with fast delivery and secure payments — wherever you are.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="footer-social-link" aria-label="Twitter / X">
                <i className="bi bi-twitter-x"></i>
              </a>
              <a href="#" className="footer-social-link" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="footer-social-link" aria-label="WhatsApp">
                <i className="bi bi-whatsapp"></i>
              </a>
              <a href="#" className="footer-social-link" aria-label="TikTok">
                <i className="bi bi-tiktok"></i>
              </a>
            </div>
            <div className="footer-payments">
              <span className="footer-payment-chip">
                <i className="bi bi-phone"></i> M-Pesa
              </span>
              <span className="footer-payment-chip">
                <i className="bi bi-paypal"></i> PayPal
              </span>
              <span className="footer-payment-chip">
                <i className="bi bi-credit-card"></i> Visa
              </span>
              <span className="footer-payment-chip">
                <i className="bi bi-credit-card-2-front"></i> Mastercard
              </span>
            </div>
          </div>

          {/* Shop column */}
          <div>
            <h6 className="footer-col-title">Shop</h6>
            <div className="footer-col-links">
              <Link to="/store" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> All Products
              </Link>
              <Link to="/store?is_flash_sale=true" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Flash Sales
              </Link>
              <Link to="/store?is_featured=true" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Featured Items
              </Link>
              <Link to="/store?is_new=true" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> New Arrivals
              </Link>
              <Link to="/store?sort=bestseller" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Best Sellers
              </Link>
            </div>
          </div>

          {/* Account column */}
          <div>
            <h6 className="footer-col-title">Account</h6>
            <div className="footer-col-links">
              <Link to="/account" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> My Profile
              </Link>
              <Link to="/orders" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> My Orders
              </Link>
              <Link to="/wishlist" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Wishlist
              </Link>
              <Link to="/cart" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Cart
              </Link>
              <Link to="/login" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Sign In
              </Link>
            </div>
          </div>

          {/* Help column */}
          <div>
            <h6 className="footer-col-title">Help</h6>
            <div className="footer-col-links">
              <Link to="/faq" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> FAQs
              </Link>
              <Link to="/shipping" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Shipping Policy
              </Link>
              <Link to="/returns" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Returns
              </Link>
              <Link to="/contact" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Contact Us
              </Link>
              <Link to="/privacy" className="footer-col-link">
                <i className="bi bi-chevron-right"></i> Privacy Policy
              </Link>
            </div>
          </div>

          {/* Contact + Newsletter column */}
          <div>
            <h6 className="footer-col-title">Get in Touch</h6>

            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <i className="bi bi-envelope"></i>
              </div>
              <div className="footer-contact-text">
                <strong>Email</strong>
                support@ikoninitv.co.ke
              </div>
            </div>

            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <i className="bi bi-telephone"></i>
              </div>
              <div className="footer-contact-text">
                <strong>Phone / WhatsApp</strong>
                +254 700 123 456
              </div>
            </div>

            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <i className="bi bi-geo-alt"></i>
              </div>
              <div className="footer-contact-text">
                <strong>Location</strong>
                Nairobi, Kenya
              </div>
            </div>

            {/* Newsletter */}
            <div className="footer-newsletter">
              <p className="footer-newsletter-label">
                Get deals straight to your inbox
              </p>
              <form onSubmit={handleNewsletter} className="footer-newsletter-input">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">
                  <i className="bi bi-send-fill"></i>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} <strong>Iko Nini TV</strong>. All rights reserved. Built for Kenya.
          </p>
          <div className="footer-bottom-links">
            <Link to="/terms" className="footer-bottom-link">Terms</Link>
            <Link to="/privacy" className="footer-bottom-link">Privacy</Link>
            <Link to="/cookies" className="footer-bottom-link">Cookies</Link>
          </div>
        </div>
      </div>

    </footer>
  )
}

export default Footer