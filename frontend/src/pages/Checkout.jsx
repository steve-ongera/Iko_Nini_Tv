import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ordersAPI } from '../services/api'
import DeliveryForm from '../components/checkout/DeliveryForm'
import MpesaPayment from '../components/checkout/MpesaPayment'
import PaypalButton from '../components/checkout/PaypalButton'
import Loader from '../components/common/Loader'
import toast from 'react-hot-toast'

const Checkout = () => {
  const { cart, total, loading: cartLoading, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
  const [deliveryData, setDeliveryData] = useState({
    deliveryType: 'pickup',
    countyId: null,
    pickupStationId: null,
    shippingFullName: user?.full_name || '',
    shippingPhone: user?.phone || '',
    shippingCounty: '',
    shippingTown: '',
    shippingStreet: '',
    shippingBuilding: '',
  })
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [orderId, setOrderId] = useState(null)
  const [placingOrder, setPlacingOrder] = useState(false)

  if (cartLoading) {
    return <Loader />
  }

  if (!cart || cart.items?.length === 0) {
    navigate('/cart')
    return null
  }

  const subtotal = total
  const grandTotal = subtotal + deliveryCost

  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    
    const orderData = {
      delivery_type: deliveryData.deliveryType,
      pickup_station_id: deliveryData.deliveryType === 'pickup' ? deliveryData.pickupStationId : null,
      shipping_full_name: deliveryData.deliveryType === 'home' ? deliveryData.shippingFullName : '',
      shipping_phone: deliveryData.deliveryType === 'home' ? deliveryData.shippingPhone : '',
      shipping_county: deliveryData.deliveryType === 'home' ? deliveryData.shippingCounty : '',
      shipping_town: deliveryData.deliveryType === 'home' ? deliveryData.shippingTown : '',
      shipping_street: deliveryData.deliveryType === 'home' ? deliveryData.shippingStreet : '',
      shipping_building: deliveryData.deliveryType === 'home' ? deliveryData.shippingBuilding : '',
      payment_method: paymentMethod,
      customer_note: '',
    }
    
    try {
      const response = await ordersAPI.create(orderData)
      const { order, payment_id } = response.data
      setOrderId(order.id)
      setStep(3)
    } catch (error) {
      console.error('Failed to place order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const handlePaymentSuccess = async () => {
    toast.success('Payment successful!')
    clearCart()
    navigate(`/order-confirmation/${orderId}`)
  }

  const handlePaymentError = (error) => {
    toast.error(error || 'Payment failed. Please try again.')
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            {/* Step 1: Delivery */}
            {step === 1 && (
              <div className="fade-in">
                <DeliveryForm
                  formData={deliveryData}
                  onChange={(field, value) => setDeliveryData({ ...deliveryData, [field]: value })}
                  onDeliveryCostChange={setDeliveryCost}
                />
                
                <div className="mt-3">
                  <button
                    onClick={() => setStep(2)}
                    className="btn btn-primary"
                    disabled={!deliveryData.countyId || (deliveryData.deliveryType === 'pickup' && !deliveryData.pickupStationId)}
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="fade-in">
                <div className="card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">Select Payment Method</h5>
                    <div className="d-flex gap-3 mb-3">
                      <label className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          value="mpesa"
                          checked={paymentMethod === 'mpesa'}
                          onChange={() => setPaymentMethod('mpesa')}
                        />
                        <img src="/images/mpesa.png" alt="M-Pesa" height="30" />
                      </label>
                      <label className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={() => setPaymentMethod('paypal')}
                        />
                        <img src="/images/paypal.png" alt="PayPal" height="30" />
                      </label>
                      <label className="d-flex align-items-center gap-2">
                        <input
                          type="radio"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                        />
                        Cash on Delivery
                      </label>
                    </div>
                    
                    <button
                      onClick={handlePlaceOrder}
                      className="btn btn-primary w-100"
                      disabled={placingOrder}
                    >
                      {placingOrder ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Placing Order...
                        </>
                      ) : (
                        `Place Order - KSh ${grandTotal.toLocaleString()}`
                      )}
                    </button>
                  </div>
                </div>
                
                <button onClick={() => setStep(1)} className="btn btn-link">
                  <i className="bi bi-arrow-left"></i> Back to Delivery
                </button>
              </div>
            )}
            
            {/* Step 3: Payment Processing */}
            {step === 3 && orderId && (
              <div className="fade-in">
                {paymentMethod === 'mpesa' && (
                  <MpesaPayment
                    orderId={orderId}
                    amount={grandTotal}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                )}
                
                {paymentMethod === 'paypal' && (
                  <PaypalButton
                    orderId={orderId}
                    amount={grandTotal}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                )}
                
                {paymentMethod === 'cod' && (
                  <div className="card">
                    <div className="card-body text-center">
                      <i className="bi bi-check-circle display-1 text-success"></i>
                      <h4 className="mt-3">Order Placed Successfully!</h4>
                      <p>You will pay KSh {grandTotal.toLocaleString()} upon delivery.</p>
                      <button onClick={handlePaymentSuccess} className="btn btn-primary mt-3">
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="col-lg-4">
            <div className="card position-sticky" style={{ top: '90px' }}>
              <div className="card-body">
                <h5 className="card-title">Order Summary</h5>
                
                <div className="mb-3">
                  {cart.items?.map(item => (
                    <div key={item.id} className="d-flex justify-content-between mb-2">
                      <span>
                        {item.product.name} x {item.quantity}
                      </span>
                      <span>KSh {Number(item.subtotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                
                <hr />
                
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
                  <strong className="text-primary fs-5">
                    KSh {Number(grandTotal).toLocaleString()}
                  </strong>
                </div>
                
                <div className="alert alert-info small">
                  <i className="bi bi-info-circle"></i>
                  {deliveryData.deliveryType === 'pickup' 
                    ? 'You will collect your order from the selected pickup station.'
                    : 'Your order will be delivered to your address.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Checkout