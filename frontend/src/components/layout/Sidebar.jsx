import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { categoriesAPI, brandsAPI } from '../../services/api'

const Sidebar = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCategories()
    fetchBrands()
    
    // Initialize filters from URL
    const params = new URLSearchParams(location.search)
    setPriceRange({
      min: params.get('min_price') || '',
      max: params.get('max_price') || '',
    })
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await brandsAPI.list()
      setBrands(response.data)
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    }
  }

  const handleCategoryChange = (categorySlug) => {
    const params = new URLSearchParams(location.search)
    if (params.get('category') === categorySlug) {
      params.delete('category')
    } else {
      params.set('category', categorySlug)
    }
    navigate(`/store?${params.toString()}`)
    if (onFilterChange) onFilterChange()
  }

  const handleBrandChange = (brandSlug) => {
    const params = new URLSearchParams(location.search)
    if (params.get('brand') === brandSlug) {
      params.delete('brand')
    } else {
      params.set('brand', brandSlug)
    }
    navigate(`/store?${params.toString()}`)
    if (onFilterChange) onFilterChange()
  }

  const handlePriceChange = () => {
    const params = new URLSearchParams(location.search)
    if (priceRange.min) params.set('min_price', priceRange.min)
    else params.delete('min_price')
    
    if (priceRange.max) params.set('max_price', priceRange.max)
    else params.delete('max_price')
    
    navigate(`/store?${params.toString()}`)
    if (onFilterChange) onFilterChange()
  }

  const handleSortChange = (sort) => {
    const params = new URLSearchParams(location.search)
    if (params.get('sort') === sort) {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    navigate(`/store?${params.toString()}`)
    if (onFilterChange) onFilterChange()
  }

  const clearFilters = () => {
    navigate('/store')
    setPriceRange({ min: '', max: '' })
    if (onFilterChange) onFilterChange()
  }

  const currentCategory = new URLSearchParams(location.search).get('category')
  const currentBrand = new URLSearchParams(location.search).get('brand')
  const currentSort = new URLSearchParams(location.search).get('sort')

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h5 className="sidebar-title">Categories</h5>
        {categories.map(category => (
          <label key={category.id} className="filter-label">
            <input
              type="checkbox"
              checked={currentCategory === category.slug}
              onChange={() => handleCategoryChange(category.slug)}
            />
            <span>{category.name}</span>
          </label>
        ))}
      </div>

      <div className="sidebar-section">
        <h5 className="sidebar-title">Brands</h5>
        {brands.map(brand => (
          <label key={brand.id} className="filter-label">
            <input
              type="checkbox"
              checked={currentBrand === brand.slug}
              onChange={() => handleBrandChange(brand.slug)}
            />
            <span>{brand.name}</span>
          </label>
        ))}
      </div>

      <div className="sidebar-section">
        <h5 className="sidebar-title">Price Range</h5>
        <div className="price-range">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>
        <button onClick={handlePriceChange} className="btn btn-primary btn-sm w-100 mt-2">
          Apply
        </button>
      </div>

      <div className="sidebar-section">
        <h5 className="sidebar-title">Sort By</h5>
        <select 
          className="form-control" 
          value={currentSort || ''}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="">Default</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      <button onClick={clearFilters} className="btn btn-outline-secondary w-100">
        Clear All Filters
      </button>
    </div>
  )
}

export default Sidebar