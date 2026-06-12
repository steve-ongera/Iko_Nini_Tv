import React from 'react'

const RatingStars = ({ rating, reviewCount, size = 'medium' }) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  const starSizes = {
    small: '12px',
    medium: '16px',
    large: '20px',
  }

  const starSize = starSizes[size]

  return (
    <div className="d-flex align-items-center gap-1">
      <div className="d-flex gap-0">
        {[...Array(fullStars)].map((_, i) => (
          <i key={`full-${i}`} className="bi bi-star-fill text-warning" style={{ fontSize: starSize }}></i>
        ))}
        {hasHalfStar && (
          <i className="bi bi-star-half text-warning" style={{ fontSize: starSize }}></i>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="bi bi-star text-muted" style={{ fontSize: starSize }}></i>
        ))}
      </div>
      {reviewCount > 0 && (
        <span className="text-muted ms-1" style={{ fontSize: size === 'small' ? '11px' : '13px' }}>
          ({reviewCount})
        </span>
      )}
    </div>
  )
}

export default RatingStars