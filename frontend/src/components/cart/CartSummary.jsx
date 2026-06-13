import React from 'react'
import { Link } from 'react-router-dom'

const CartSummary = ({ subtotal, deliveryCost = 0, total }) => {
  const savings = subtotal - (total - deliveryCost)

  return (
    <div className="order-summary-panel">

      <div className="order-summary-header">
        Order Summary
      </div>

      <div className="order-summary-body">

        <div className="order-summary-row">
          <span className="label">Subtotal</span>
          <span className="value">KSh {Number(subtotal).toLocaleString()}</span>
        </div>

        <div className="order-summary-row">
          <span className="label">Delivery</span>
          <span className="value">
            {deliveryCost === 0
              ? <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>Free</span>
              : `KSh ${Number(deliveryCost).toLocaleString()}`
            }
          </span>
        </div>

        {savings > 0 && (
          <div className="order-summary-row">
            <span className="label" style={{ color: 'var(--color-success)' }}>
              <i className="bi bi-tag" style={{ marginRight: '0.25rem' }}></i>
              You save
            </span>
            <span className="value" style={{ color: 'var(--color-success)' }}>
              KSh {Number(savings).toLocaleString()}
            </span>
          </div>
        )}

        <div className="order-summary-row total">
          <span className="label">Total</span>
          <span className="value">KSh {Number(total).toLocaleString()}</span>
        </div>

        {/* M-Pesa note */}
        <div style={{
          background: 'var(--gray-50)',
          border: '1px solid var(--gray-150)',
          borderRadius: 'var(--radius)',
          padding: '0.625rem 0.875rem',
          fontSize: 'var(--text-xs)',
          color: 'var(--gray-500)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: '0.75rem 0',
        }}>
          <i className="bi bi-shield-check" style={{ color: 'var(--color-success)', fontSize: '1rem' }}></i>
          Secure checkout via M-Pesa, PayPal or card
        </div>

        <Link to="/checkout" className="btn btn-primary btn-lg btn-block">
          <i className="bi bi-lock"></i> Proceed to Checkout
        </Link>

        <Link to="/store" className="btn btn-ghost btn-block" style={{ marginTop: '0.5rem' }}>
          <i className="bi bi-arrow-left"></i> Continue Shopping
        </Link>

      </div>
    </div>
  )
}

export default CartSummary