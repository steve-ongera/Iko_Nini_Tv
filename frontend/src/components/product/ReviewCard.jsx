import React from 'react'
import RatingStars from './RatingStars'
import { formatDistanceToNow } from 'date-fns'

const ReviewCard = ({ review }) => {
  return (
    <div className="border-bottom pb-3 mb-3">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <strong>{review.user_name}</strong>
          {review.verified_purchase && (
            <span className="badge bg-success ms-2 small">Verified Purchase</span>
          )}
        </div>
        <small className="text-muted">
          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
        </small>
      </div>
      
      <RatingStars rating={review.rating} size="small" />
      
      {review.title && (
        <h6 className="mt-2 mb-1">{review.title}</h6>
      )}
      
      <p className="text-muted mb-0">{review.body}</p>
    </div>
  )
}

export default ReviewCard