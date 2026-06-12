import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({ placeholder = 'Search products...', className = '' }) => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/store?search=${encodeURIComponent(query)}`)
      setQuery('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="position-relative">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingRight: '40px' }}
        />
        <button
          type="submit"
          className="position-absolute bg-transparent border-0"
          style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <i className="bi bi-search"></i>
        </button>
      </div>
    </form>
  )
}

export default SearchBar