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

const STEPS = [
  { n: 1, label: 'Delivery' },
  { n: 2, label: 'Payment' },
  { n: 3, label: 'Confirm' },
]

const PAYMENT_METHODS = [
  { value: 'mpesa',  label: 'M-Pesa',           icon: 'bi-phone',       img: '/images/mpesa.png' },
  { value: 'paypal', label: 'PayPal',            icon: 'bi-paypal',      img: '/images/paypal.png' },
  { value: 'cod',    label: 'Cash on Delivery',  icon: 'bi-cash-stack',  img: null },
]

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

  if (cartLoading) return <Loader />
  if (!cart || !cart.items?.length) { navigate('/cart'); return null }

  const subtotal   = total
  const grandTotal = subtotal + deliveryCost

  const canProceedToPayment =
    formData => formData.countyId &&
    (formData.deliveryType === 'home' || formData.pickupStationId)

  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    const orderData = {
      delivery_type:       deliveryData.deliveryType,
      pickup_station_id:   deliveryData.deliveryType === 'pickup' ? deliveryData.pickupStationId : null,
      shipping_full_name:  deliveryData.deliveryType === 'home'   ? deliveryData.shippingFullName : '',
      shipping_phone:      deliveryData.deliveryType === 'home'   ? deliveryData.shippingPhone : '',
      shipping_county:     deliveryData.deliveryType === 'home'   ? deliveryData.shippingCounty : '',
      shipping_town:       deliveryData.deliveryType === 'home'   ? deliveryData.shippingTown : '',
      shipping_street:     deliveryData.deliveryType === 'home'   ? deliveryData.shippingStreet : '',
      shipping_building:   deliveryData.deliveryType === 'home'   ? deliveryData.shippingBuilding : '',
      payment_method:      paymentMethod,
      customer_note:       '',
    }
    try {
      const res = await ordersAPI.create(orderData)
      setOrderId(res.data.order.id)
      setStep(3)
    } catch {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const handlePaymentSuccess = () => {
    toast.success('Payment successful!')
    clearCart()
    navigate(`/order-confirmation/${orderId}`)
  }

  const handlePaymentError = (err) => toast.error(err || 'Payment failed. Please try again.')

  return (
    <>
      <Helmet>
        <title>{`Checkout — Iko Nini TV`}</title>
      </Helmet>

      <div className="container">

        {/* Progress steps */}
        <div className="checkout-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`checkout-step ${step > s.n ? 'completed' : ''} ${step === s.n ? 'active' : ''}`}
            >
              <div className="checkout-step-bubble">
                {step > s.n
                  ? <i className="bi bi-check-lg"></i>
                  : s.n}
              </div>
              <div className="checkout-step-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="cart-layout">

          {/* Left — step content */}
          <div>

            {/* Step 1: Delivery */}
            {step === 1 && (
              <div className="animate-fade-in">
                <DeliveryForm
                  formData={deliveryData}
                  onChange={(field, value) => setDeliveryData(d => ({ ...d, [field]: value }))}
                  onDeliveryCostChange={setDeliveryCost}
                />
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-primary btn-lg"
                  disabled={!canProceedToPayment(deliveryData)}
                >
                  Continue to Payment <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="animate-fade-in">
                <div style={{
                  background: 'white',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--gray-150)',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                }}>
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--gray-150)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 'var(--text-base)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <i className="bi bi-credit-card" style={{ color: 'var(--brand-red)' }}></i>
                    Select Payment Method
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {PAYMENT_METHODS.map(pm => (
                      <label
                        key={pm.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.875rem',
                          padding: '0.875rem 1rem',
                          border: `1.5px solid ${paymentMethod === pm.value ? 'var(--brand-red)' : 'var(--gray-200)'}`,
                          borderRadius: 'var(--radius-lg)',
                          background: paymentMethod === pm.value ? 'var(--brand-red-pale)' : 'white',
                          cursor: 'pointer',
                          transition: 'var(--transition-fast)',
                        }}
                        onClick={() => setPaymentMethod(pm.value)}
                      >
                        <input
                          type="radio"
                          value={pm.value}
                          checked={paymentMethod === pm.value}
                          onChange={() => setPaymentMethod(pm.value)}
                          style={{ accentColor: 'var(--brand-red)' }}
                        />
                        {pm.img
                          ? <img src={pm.img} alt={pm.label} style={{ height: '28px', objectFit: 'contain' }} />
                          : <i className={`bi ${pm.icon}`} style={{ fontSize: '1.5rem', color: 'var(--gray-600)' }}></i>
                        }
                        <span style={{
                          fontWeight: paymentMethod === pm.value ? 700 : 500,
                          fontSize: 'var(--text-sm)',
                          color: paymentMethod === pm.value ? 'var(--brand-red)' : 'var(--gray-700)',
                        }}>
                          {pm.label}
                        </span>
                        {paymentMethod === pm.value && (
                          <i className="bi bi-check-circle-fill" style={{ marginLeft: 'auto', color: 'var(--brand-red)' }}></i>
                        )}
                      </label>
                    ))}
                  </div>

                  <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    <button
                      onClick={handlePlaceOrder}
                      className={`btn btn-primary btn-lg btn-block ${placingOrder ? 'loading' : ''}`}
                      disabled={placingOrder}
                    >
                      {!placingOrder && <i className="bi bi-lock"></i>}
                      {placingOrder ? 'Placing Order…' : `Place Order — KSh ${grandTotal.toLocaleString()}`}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="btn btn-ghost"
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  <i className="bi bi-arrow-left"></i> Back to Delivery
                </button>
              </div>
            )}

            {/* Step 3: Payment processing */}
            {step === 3 && orderId && (
              <div className="animate-fade-in">
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
                  <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--gray-150)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: 'var(--color-success-pale)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                    }}>
                      <i className="bi bi-check-lg" style={{ fontSize: '2rem', color: 'var(--color-success)' }}></i>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
                      Order Placed Successfully!
                    </h4>
                    <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>
                      You'll pay <strong>KSh {grandTotal.toLocaleString()}</strong> upon delivery.
                    </p>
                    <button onClick={handlePaymentSuccess} className="btn btn-primary btn-lg">
                      View Order <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right — order summary */}
          <div className="order-summary-panel" style={{ position: 'sticky', top: 'calc(var(--total-nav-height) + 1rem)' }}>
            <div className="order-summary-header">Order Summary</div>
            <div className="order-summary-body">

              {/* Line items */}
              {cart.items?.map(item => (
                <div className="order-summary-row" key={item.id}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span className="badge badge-gray">{item.quantity}×</span>
                    <span style={{ fontSize: 'var(--text-xs)' }}>{item.product.name}</span>
                  </span>
                  <span className="value">KSh {Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}

              <div className="order-summary-row">
                <span className="label">Subtotal</span>
                <span className="value">KSh {Number(subtotal).toLocaleString()}</span>
              </div>

              <div className="order-summary-row">
                <span className="label">Delivery</span>
                <span className="value">
                  {deliveryCost === 0
                    ? <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>Free</span>
                    : `KSh ${Number(deliveryCost).toLocaleString()}`}
                </span>
              </div>

              <div className="order-summary-row total">
                <span className="label">Total</span>
                <span className="value">KSh {Number(grandTotal).toLocaleString()}</span>
              </div>

              {/* Delivery note */}
              <div className="alert alert-info" style={{ marginTop: '0.75rem', fontSize: 'var(--text-xs)' }}>
                <i className="bi bi-info-circle"></i>
                <div className="alert-content">
                  {deliveryData.deliveryType === 'pickup'
                    ? 'Collect your order from the selected pickup station.'
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