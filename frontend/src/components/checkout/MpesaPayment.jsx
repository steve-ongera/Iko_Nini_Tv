import React, { useState } from 'react'
import { paymentsAPI } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const MpesaPayment = ({ orderId, amount, onSuccess, onError }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkoutRequestId, setCheckoutRequestId] = useState(null)
  const [polling, setPolling] = useState(false)
  const { showSuccess, showError, showLoading, dismiss } = useToast()

  const handlePayment = async (e) => {
    e.preventDefault()
    
    if (!phoneNumber || phoneNumber.length !== 12 || !phoneNumber.startsWith('254')) {
      showError('Please enter a valid M-Pesa number (254XXXXXXXXX)')
      return
    }
    
    setLoading(true)
    const loadingToast = showLoading('Initiating M-Pesa payment...')
    
    try {
      const response = await paymentsAPI.mpesaInitiate(orderId, phoneNumber)
      const { checkout_request_id, customer_message } = response.data
      
      setCheckoutRequestId(checkout_request_id)
      dismiss(loadingToast)
      showSuccess(customer_message || 'STK Push sent! Check your phone.')
      
      // Start polling for status
      startPolling(checkout_request_id)
    } catch (error) {
      dismiss(loadingToast)
      const message = error.response?.data?.error || 'Failed to initiate payment'
      showError(message)
      if (onError) onError(message)
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (requestId) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 24 // 2 minutes (5 sec intervals)
    
    const pollInterval = setInterval(async () => {
      attempts++
      
      try {
        const response = await paymentsAPI.mpesaStatus(requestId)
        const { is_confirmed, result_code, result_description, mpesa_receipt_number } = response.data
        
        if (is_confirmed) {
          clearInterval(pollInterval)
          setPolling(false)
          showSuccess(`Payment confirmed! Receipt: ${mpesa_receipt_number}`)
          if (onSuccess) onSuccess()
        } else if (result_code === '1037') {
          clearInterval(pollInterval)
          setPolling(false)
          showError('Payment cancelled by user')
          if (onError) onError('Payment cancelled')
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setPolling(false)
          showError('Payment timeout. Please check your M-Pesa statement.')
          if (onError) onError('Payment timeout')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="text-center mb-3">
          <img src="/images/mpesa-logo.png" alt="M-Pesa" height="50" />
          <h6 className="mt-2">Pay with M-Pesa</h6>
          <p className="text-muted small">Amount: KSh {Number(amount).toLocaleString()}</p>
        </div>
        
        <form onSubmit={handlePayment}>
          <div className="mb-3">
            <label className="form-label">M-Pesa Phone Number</label>
            <div className="input-group">
              <span className="input-group-text">+254</span>
              <input
                type="tel"
                className="form-control"
                placeholder="712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength="9"
                disabled={loading || polling}
                required
              />
            </div>
            <small className="text-muted">Enter the phone number registered with M-Pesa</small>
          </div>
          
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading || polling}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Initializing...
              </>
            ) : polling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Waiting for confirmation...
              </>
            ) : (
              <>
                <i className="bi bi-phone"></i> Pay KSh {Number(amount).toLocaleString()}
              </>
            )}
          </button>
        </form>
        
        {polling && (
          <div className="alert alert-info mt-3 mb-0">
            <i className="bi bi-info-circle"></i>
            <small> Check your phone, enter your PIN, and confirm the payment.</small>
          </div>
        )}
      </div>
    </div>
  )
}

export default MpesaPayment