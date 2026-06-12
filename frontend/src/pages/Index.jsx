import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { productsAPI, bannersAPI } from '../services/api'
import ProductCarousel from '../components/product/ProductCarousel'
import Loader from '../components/common/Loader'

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [flashSales, setFlashSales] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [featuredRes, flashRes, bannersRes] = await Promise.all([
        productsAPI.featured(),
        productsAPI.flashSales(),
        bannersAPI.list(),
      ])
      
      setFeaturedProducts(featuredRes.data)
      setFlashSales(flashRes.data)
      setBanners(bannersRes.data)
    } catch (error) {
      console.error('Failed to fetch home data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <>
      <Helmet>
        <title>Iko Nini TV - Shop Smart, Live Better</title>
        <meta name="description" content="Kenya's premier e-commerce marketplace. Shop electronics, fashion, home goods and more with fast delivery and secure payments." />
      </Helmet>

      {/* Hero Banner */}
      <div className="hero-section mb-5">
        <div className="container">
          <div className="row align-items-center py-5">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-3">
                Shop Smart, <span className="text-primary">Live Better</span>
              </h1>
              <p className="lead text-muted mb-4">
                Kenya's premier online marketplace. Discover amazing deals on electronics, 
                fashion, home goods, and more. Fast delivery and secure payments.
              </p>
              <Link to="/store" className="btn btn-primary btn-lg">
                Shop Now <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <div className="col-lg-6">
              <img 
                src="/images/hero-banner.png" 
                alt="Shopping" 
                className="img-fluid"
                style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banners */}
      {banners.length > 0 && (
        <div className="container mb-5">
          <div className="row g-3">
            {banners.map(banner => (
              <div key={banner.id} className="col-md-6">
                <a href={banner.link} className="text-decoration-none">
                  <div className="card border-0 overflow-hidden">
                    <img 
                      src={banner.image} 
                      alt={banner.title}
                      className="img-fluid"
                      style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                    />
                    <div className="card-img-overlay d-flex flex-column justify-content-center">
                      <h4 className="text-white">{banner.title}</h4>
                      <p className="text-white">{banner.subtitle}</p>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="container mb-5">
        <h3 className="mb-4">Shop by Category</h3>
        <div className="row g-3">
          {categories.map(category => (
            <div key={category.id} className="col-6 col-md-3 col-lg-2">
              <Link to={`/store?category=${category.slug}`} className="text-decoration-none">
                <div className="card text-center border-0 shadow-sm h-100">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="card-img-top"
                      style={{ height: '120px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '120px' }}>
                      <i className="bi bi-tag display-4 text-muted"></i>
                    </div>
                  )}
                  <div className="card-body">
                    <h6 className="mb-0">{category.name}</h6>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Flash Sales */}
      {flashSales.length > 0 && (
        <div className="container mb-5">
          <ProductCarousel 
            products={flashSales} 
            title="🔥 Flash Sales" 
            viewAllLink="/store?is_flash_sale=true"
          />
        </div>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="container mb-5">
          <ProductCarousel 
            products={featuredProducts} 
            title="✨ Featured Products" 
            viewAllLink="/store?is_featured=true"
          />
        </div>
      )}

      {/* Features Section */}
      <div className="container mb-5">
        <div className="row g-4">
          <div className="col-md-3 col-6">
            <div className="text-center">
              <i className="bi bi-truck display-4 text-primary"></i>
              <h6 className="mt-2">Fast Delivery</h6>
              <small className="text-muted">Delivery across Kenya</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="text-center">
              <i className="bi bi-shield-check display-4 text-primary"></i>
              <h6 className="mt-2">Secure Payments</h6>
              <small className="text-muted">M-Pesa & PayPal</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="text-center">
              <i className="bi bi-arrow-repeat display-4 text-primary"></i>
              <h6 className="mt-2">Easy Returns</h6>
              <small className="text-muted">7-day return policy</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="text-center">
              <i className="bi bi-headset display-4 text-primary"></i>
              <h6 className="mt-2">24/7 Support</h6>
              <small className="text-muted">Customer service</small>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Sample categories - in production, fetch from API
const categories = [
  { id: 1, name: 'Electronics', slug: 'electronics', image: null },
  { id: 2, name: 'Fashion', slug: 'fashion', image: null },
  { id: 3, name: 'Home & Living', slug: 'home-living', image: null },
  { id: 4, name: 'Health & Beauty', slug: 'health-beauty', image: null },
  { id: 5, name: 'Sports', slug: 'sports', image: null },
  { id: 6, name: 'Toys', slug: 'toys', image: null },
]

export default Index