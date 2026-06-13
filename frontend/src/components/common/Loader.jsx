import React from 'react'

const Loader = ({ size = 'medium', fullScreen = false, text = '' }) => {
  const sizeMap = { small: 20, medium: 40, large: 64 }
  const px = sizeMap[size] || 40

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem' }}>
      {/* Outer ring */}
      <div style={{ position: 'relative', width: px, height: px }}>
        <div style={{
          width: px, height: px,
          border: `${px * 0.075}px solid var(--gray-200)`,
          borderTop: `${px * 0.075}px solid var(--brand-red)`,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        {/* Inner dot — only on medium/large */}
        {size !== 'small' && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: px * 0.28, height: px * 0.28,
            background: 'var(--brand-red)',
            borderRadius: '50%',
            opacity: 0.15,
          }} />
        )}
      </div>
      {text && (
        <span style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--gray-500)',
          fontWeight: 500,
          fontFamily: 'var(--font-display)',
        }}>
          {text}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        zIndex: 'var(--z-modal)',
      }}>
        {/* Brand mark */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.5rem',
          color: 'var(--brand-red)',
          letterSpacing: '-0.03em',
          marginBottom: '0.5rem',
        }}>
          Iko<span style={{ color: 'var(--gray-300)' }}>Nini</span> TV
        </div>
        {spinner}
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--gray-400)',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Loading…
        </span>
      </div>
    )
  }

  // Inline / section loader
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: size === 'small' ? '1rem' : '3rem',
      width: '100%',
    }}>
      {spinner}
    </div>
  )
}

export default Loader