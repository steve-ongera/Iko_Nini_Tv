import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation, useNavigate } from 'react-router-dom'
import { productsAPI } from '../services/api'
import ProductGrid from '../components/product/ProductGrid'
import Sidebar from '../components/layout/Sidebar'
import Pagination from '../components/common/Pagination'
import SearchBar from '../components/common/SearchBar'
import Loader from '../components/common/Loader'

const Store = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const page = parseInt(params.get('page')) || 1
    setCurrentPage(page)
    fetchProducts()
  }, [location.search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(location.search)
      params.set('page', currentPage)
      
      const response = await productsAPI.list(params)
      setProducts(response.data.results || response.data)
      
      // Handle pagination
      if (response.data.count) {
        const pages = Math.ceil(response.data.count / 20)
        setTotalPages(pages)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    const params = new URLSearchParams(location.search)
    params.set('page', page)
    navigate(`/store?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  return (
    <>
      <Helmet>
        <title>Store - Iko Nini TV</title>
        <meta name="description" content="Shop the best products in Kenya. Great deals on electronics, fashion, home goods and more." />
      </Helmet>

      <div className="container">
        {/* Mobile Search */}
        <div className="d-md-none mb-3">
          <SearchBar />
        </div>
        
        <div className="row">
          {/* Sidebar - Desktop */}
          <div className="col-lg-3 d-none d-lg-block">
            <Sidebar onFilterChange={handleFilterChange} />
          </div>
          
          {/* Products Grid */}
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">
                {products.length > 0 && `Showing ${products.length} products`}
              </h4>
              <div className="d-lg-none">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#filterOffcanvas"
                >
                  <i className="bi bi-funnel"></i> Filters
                </button>
              </div>
            </div>
            
            <ProductGrid products={products} loading={loading} />
            
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Offcanvas */}
      <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="filterOffcanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          <Sidebar onFilterChange={handleFilterChange} />
        </div>
      </div>
    </>
  )
}

export default Store