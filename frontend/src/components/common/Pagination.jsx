import React from 'react'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button
        className="page-link"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="bi bi-chevron-left"></i>
      </button>
      
      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          className={`page-link ${page === currentPage ? 'active' : ''}`}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
        >
          {page}
        </button>
      ))}
      
      <button
        className="page-link"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  )
}

export default Pagination