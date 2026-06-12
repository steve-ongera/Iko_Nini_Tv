import React from 'react'
import { Link } from 'react-router-dom'

const CartSummary = ({ subtotal, deliveryCost = 0, total }) => {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-3">Order Summary</h5>
        
        <div className="d-flex justify-content-between mb-2">
          <span>Subtotal</span>
          <span>KSh {Number(subtotal).toLocaleString()}</span>
        </div>
        
        <div className="d-flex justify-content-between mb-2">
          <span>Delivery</span>
          <span>KSh {Number(deliveryCost).toLocaleString()}</span>
        </div>
        
        <hr />
        
        <div className="d-flex justify-content-between mb-3">
          <strong>Total</strong>
          <strong className="text-primary fs-5">KSh {Number(total).toLocaleString()}</strong>
        </div>
        
        <Link to="/checkout" className="btn btn-primary w-100">
          Proceed to Checkout
        </Link>
        
        <Link to="/store" className="btn btn-outline-secondary w-100 mt-2">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default CartSummary