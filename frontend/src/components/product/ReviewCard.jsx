import React from 'react'
import RatingStars from './RatingStars'
import { formatDistanceToNow } from 'date-fns'

const ReviewCard = ({ review }) => {
  const initials = review.user_name
    ? review.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  // Deterministic avatar colour from username
  const COLOURS = [
    'var(--brand-red)',
    'var(--brand-navy)',
    'var(--brand-orange)',
    'var(--color-success)',
    'var(--color-info)',
  ]
  const avatarBg = COLOURS[(review.user_name?.charCodeAt(0) || 0) % COLOURS.length]

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--gray-150)',
      borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.25rem',
      marginBottom: '0.875rem',
      transition: 'var(--transition-fast)',
    }}>

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '0.625rem',
        flexWrap: 'wrap',
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: avatarBg,
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              color: 'var(--gray-900)',
              lineHeight: 1.2,
            }}>
              {review.user_name}
            </div>
            {review.verified_purchase && (
              <span className="badge badge-success" style={{ fontSize: '0.55rem', marginTop: '0.125rem' }}>
                <i className="bi bi-patch-check-fill" style={{ marginRight: '0.2rem' }}></i>
                Verified Purchase
              </span>
            )}
          </div>
        </div>

        {/* Date */}
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--gray-400)',
          whiteSpace: 'nowrap',
          paddingTop: '0.125rem',
        }}>
          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Stars */}
      <div style={{ marginBottom: review.title ? '0.375rem' : '0.5rem' }}>
        <RatingStars rating={review.rating} size="small" />
      </div>

      {/* Title */}
      {review.title && (
        <div style={{
          fontWeight: 700,
          fontSize: 'var(--text-sm)',
          color: 'var(--gray-900)',
          fontFamily: 'var(--font-display)',
          marginBottom: '0.25rem',
        }}>
          {review.title}
        </div>
      )}

      {/* Body */}
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--gray-600)',
        lineHeight: 1.7,
        margin: 0,
      }}>
        {review.body}
      </p>

      {/* Helpful row — optional interaction */}
      {review.helpful_count > 0 && (
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.625rem',
          borderTop: '1px solid var(--gray-100)',
          fontSize: 'var(--text-xs)',
          color: 'var(--gray-400)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}>
          <i className="bi bi-hand-thumbs-up"></i>
          {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
        </div>
      )}
    </div>
  )
}

export default ReviewCard