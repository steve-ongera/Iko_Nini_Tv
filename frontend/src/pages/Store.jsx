import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation, useNavigate } from 'react-router-dom'
import { productsAPI } from '../services/api'
import ProductGrid from '../components/product/ProductGrid'
import Sidebar from '../components/layout/Sidebar'
import Pagination from '../components/common/Pagination'
import Loader from '../components/common/Loader'

const Store = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Derive a readable page title from active filters
  const params = new URLSearchParams(location.search)
  const activeSearch   = params.get('search')
  const activeCategory = params.get('category')
  const activeFlash    = params.get('is_flash_sale')
  const activeFeatured = params.get('is_featured')

  const pageTitle = activeSearch
    ? `Results for "${activeSearch}"`
    : activeFlash    ? 'Flash Sales'
    : activeFeatured ? 'Featured Products'
    : activeCategory ? activeCategory.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'All Products'

  useEffect(() => {
    const page = parseInt(params.get('page')) || 1
    setCurrentPage(page)
    fetchProducts()
  }, [location.search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams(location.search)
      const response = await productsAPI.list(p)
      const data = response.data

      if (data.results) {
        setProducts(data.results)
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil(data.count / 20) || 1)
      } else {
        setProducts(Array.isArray(data) ? data : [])
        setTotalCount(Array.isArray(data) ? data.length : 0)
        setTotalPages(1)
      }
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    const p = new URLSearchParams(location.search)
    p.set('page', page)
    navigate(`/store?${p.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    setDrawerOpen(false)
  }

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} — Iko Nini TV`}</title>
        <meta name="description" content="Shop the best products in Kenya. Great deals on electronics, fashion, home goods and more." />
      </Helmet>

      <div className="container">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="section-header" style={{ marginBottom: '1.25rem' }}>
          <h2 className="section-title" style={{ textTransform: 'capitalize' }}>
            <span className="section-title-accent"></span>
            {pageTitle}
            {!loading && totalCount > 0 && (
              <span style={{
                marginLeft: '0.625rem',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--gray-400)',
                fontFamily: 'var(--font-body)',
              }}>
                ({totalCount.toLocaleString()} products)
              </span>
            )}
          </h2>

          {/* Mobile filter trigger */}
          <button
            className="btn btn-outline-primary btn-sm mobile-only"
            onClick={() => setDrawerOpen(true)}
          >
            <i className="bi bi-funnel"></i> Filters
          </button>
        </div>

        {/* ── Sidebar + grid ──────────────────────────────────────────── */}
        <div className="layout-sidebar">

          {/* Sidebar — desktop */}
          <div className="desktop-only">
            <Sidebar onFilterChange={handleFilterChange} />
          </div>

          {/* Products */}
          <div>
            {loading ? (
              <Loader />
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="bi bi-search"></i>
                </div>
                <div className="empty-state-title">No products found</div>
                <div className="empty-state-desc">
                  Try adjusting your filters or search term to find what you're looking for.
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/store')}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <ProductGrid products={products} loading={false} />

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────────── */}
      <>
        {/* Backdrop */}
        {drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 'calc(var(--z-modal) - 1)',
              backdropFilter: 'blur(2px)',
            }}
          />
        )}

        {/* Drawer panel */}
        <div style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 'min(320px, 88vw)',
          background: 'white',
          zIndex: 'var(--z-modal)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Drawer header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--gray-150)',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
              <i className="bi bi-funnel" style={{ color: 'var(--brand-red)', marginRight: '0.5rem' }}></i>
              Filters
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.25rem', color: 'var(--gray-500)', lineHeight: 1,
              }}
              aria-label="Close filters"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Scrollable sidebar inside drawer */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <Sidebar onFilterChange={handleFilterChange} />
          </div>
        </div>
      </>
    </>
  )
}

export default Store