import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { categoriesAPI, brandsAPI } from '../../services/api'

const Sidebar = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    sort: true,
  })
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const currentCategory = params.get('category')
  const currentBrand    = params.get('brand')
  const currentSort     = params.get('sort')
  const currentRating   = params.get('min_rating')

  useEffect(() => {
    fetchCategories()
    fetchBrands()
    setPriceRange({
      min: params.get('min_price') || '',
      max: params.get('max_price') || '',
    })
  }, [location.search])

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Handles both plain arrays and DRF paginated { results: [] } responses
  const toArray = (data) => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.results)) return data.results
    return []
  }

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.list()
      setCategories(toArray(res.data))
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setCategories([])
    }
  }

  const fetchBrands = async () => {
    try {
      const res = await brandsAPI.list()
      setBrands(toArray(res.data))
    } catch (err) {
      console.error('Failed to fetch brands:', err)
      setBrands([])
    }
  }

  // ── URL helpers ────────────────────────────────────────────────────────────
  const updateParam = (key, value) => {
    const p = new URLSearchParams(location.search)
    if (value && p.get(key) !== value) p.set(key, value)
    else p.delete(key)
    navigate(`/store?${p.toString()}`)
    onFilterChange?.()
  }

  const handlePriceApply = () => {
    const p = new URLSearchParams(location.search)
    priceRange.min ? p.set('min_price', priceRange.min) : p.delete('min_price')
    priceRange.max ? p.set('max_price', priceRange.max) : p.delete('max_price')
    navigate(`/store?${p.toString()}`)
    onFilterChange?.()
  }

  const clearFilters = () => {
    navigate('/store')
    setPriceRange({ min: '', max: '' })
    onFilterChange?.()
  }

  const toggleSection = (key) =>
    setOpenSections(s => ({ ...s, [key]: !s[key] }))

  // ── Active filter count for the header badge ───────────────────────────────
  const activeCount = [currentCategory, currentBrand, currentSort, currentRating,
    params.get('min_price'), params.get('max_price')].filter(Boolean).length

  return (
    <aside className="sidebar">

      {/* Header */}
      <div className="sidebar-header">
        <h5>
          <i className="bi bi-funnel" style={{ marginRight: '0.5rem', color: 'var(--brand-red)' }}></i>
          Filters
          {activeCount > 0 && (
            <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>{activeCount}</span>
          )}
        </h5>
        {activeCount > 0 && (
          <span className="sidebar-clear" onClick={clearFilters}>Clear all</span>
        )}
      </div>

      {/* ── Categories ──────────────────────────────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-section-header" onClick={() => toggleSection('categories')}>
          <span className="sidebar-section-title">Categories</span>
          <i className={`bi bi-chevron-down sidebar-section-toggle ${openSections.categories ? '' : 'collapsed'}`}></i>
        </div>

        {openSections.categories && (
          <div>
            {categories.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', padding: '0.25rem 0' }}>
                No categories found
              </p>
            ) : (
              categories.map(cat => (
                <label key={cat.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={currentCategory === cat.slug}
                    onChange={() => updateParam('category', cat.slug)}
                  />
                  <span>{cat.name}</span>
                  {cat.product_count != null && (
                    <span className="filter-option-count">{cat.product_count}</span>
                  )}
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Brands ──────────────────────────────────────────────────────── */}
      {brands.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => toggleSection('brands')}>
            <span className="sidebar-section-title">Brands</span>
            <i className={`bi bi-chevron-down sidebar-section-toggle ${openSections.brands ? '' : 'collapsed'}`}></i>
          </div>

          {openSections.brands && (
            <div>
              {brands.map(brand => (
                <label key={brand.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={currentBrand === brand.slug}
                    onChange={() => updateParam('brand', brand.slug)}
                  />
                  <span>{brand.name}</span>
                  {brand.product_count != null && (
                    <span className="filter-option-count">{brand.product_count}</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Price Range ──────────────────────────────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-section-header" onClick={() => toggleSection('price')}>
          <span className="sidebar-section-title">Price Range (KSh)</span>
          <i className={`bi bi-chevron-down sidebar-section-toggle ${openSections.price ? '' : 'collapsed'}`}></i>
        </div>

        {openSections.price && (
          <div>
            <div className="price-range-inputs">
              <input
                type="number"
                className="price-range-input"
                placeholder="Min"
                value={priceRange.min}
                onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))}
                min="0"
              />
              <span className="price-range-sep">—</span>
              <input
                type="number"
                className="price-range-input"
                placeholder="Max"
                value={priceRange.max}
                onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))}
                min="0"
              />
            </div>
            <button
              onClick={handlePriceApply}
              className="btn btn-outline-primary btn-sm btn-block"
            >
              Apply Price
            </button>
          </div>
        )}
      </div>

      {/* ── Rating ──────────────────────────────────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-section-header" onClick={() => toggleSection('sort')}>
          <span className="sidebar-section-title">Min Rating</span>
          <i className={`bi bi-chevron-down sidebar-section-toggle ${openSections.sort ? '' : 'collapsed'}`}></i>
        </div>

        {openSections.sort && (
          <div>
            {[4, 3, 2, 1].map(star => (
              <div
                key={star}
                className="rating-filter-item"
                onClick={() => updateParam('min_rating', String(star))}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  readOnly
                  checked={currentRating === String(star)}
                  style={{ accentColor: 'var(--brand-red)', cursor: 'pointer' }}
                />
                <div className="rating-stars" style={{ display: 'flex', gap: '1px' }}>
                  {[1,2,3,4,5].map(s => (
                    <i key={s} className={`bi ${s <= star ? 'bi-star-fill' : 'bi-star'}`}
                      style={{ fontSize: '0.7rem', color: s <= star ? 'var(--color-warning)' : 'var(--gray-300)' }}
                    ></i>
                  ))}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>& up</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sort By ─────────────────────────────────────────────────────── */}
      <div className="sidebar-section" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
        <div className="sidebar-section-header" style={{ marginBottom: '0.875rem' }}>
          <span className="sidebar-section-title">Sort By</span>
        </div>
        <select
          className="form-control"
          value={currentSort || ''}
          onChange={e => updateParam('sort', e.target.value)}
        >
          <option value="">Default</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

    </aside>
  )
}

export default Sidebar