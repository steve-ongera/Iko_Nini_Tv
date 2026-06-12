import React from 'react'
import { PayPalButtons } from '@paypal/react-paypal-js'
import { paymentsAPI } from '../../services/api'

const PaypalButton = ({ orderId, amount, onSuccess, onError: onPaymentError }) => {
  const createOrder = async () => {
    try {
      const response = await paymentsAPI.paypalCreateOrder(orderId)
      return response.data.paypal_order_id
    } catch (error) {
      console.error('Failed to create PayPal order:', error)
      if (onPaymentError) onPaymentError('Failed to initialize PayPal payment')
      throw error
    }
  }

  const onApprove = async (data, actions) => {
    try {
      const response = await paymentsAPI.paypalCapture(data.orderID)
      
      if (response.data.status === 'COMPLETED') {
        if (onSuccess) onSuccess()
      } else {
        if (onPaymentError) onPaymentError('Payment not completed')
      }
    } catch (error) {
      console.error('PayPal capture error:', error)
      if (onPaymentError) onPaymentError('Payment failed. Please try again.')
    }
  }

  const handleError = (error) => {
    console.error('PayPal error:', error)
    if (onPaymentError) onPaymentError('PayPal payment error. Please try again.')
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="text-center mb-3">
          <img src="/images/paypal-logo.png" alt="PayPal" height="40" />
          <h6 className="mt-2">Pay with PayPal</h6>
          <p className="text-muted small">Amount: KSh {Number(amount).toLocaleString()}</p>
        </div>
        
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={handleError}
          style={{ layout: 'vertical' }}
        />
      </div>
    </div>
  )
}

export default PaypalButton