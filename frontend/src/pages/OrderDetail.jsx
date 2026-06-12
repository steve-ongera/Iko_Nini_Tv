import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import Loader from '../components/common/Loader'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const OrderDetail = () => {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [orderNumber])

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.detail(orderNumber)
      setOrder(response.data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
      toast.error('Order not found')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    setCancelling(true)
    try {
      await ordersAPI.cancel(orderNumber)
      toast.success('Order cancelled successfully')
      fetchOrder()
    } catch (error) {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-warning',
      confirmed: 'bg-info',
      processing: 'bg-primary',
      shipped: 'bg-secondary',
      out_for_delivery: 'bg-success',
      delivered: 'bg-success',
      cancelled: 'bg-danger',
      refunded: 'bg-danger',
    }
    return classes[status] || 'bg-secondary'
  }

  const canCancel = order && ['pending', 'confirmed'].includes(order.status)

  if (loading) {
    return <Loader />
  }

  if (!order) {
    return null
  }

  return (
    <>
      <Helmet>
        <title>Order #{order.order_number} - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <div className="mb-3">
          <Link to="/orders" className="text-decoration-none">
            <i className="bi bi-arrow-left"></i> Back to Orders
          </Link>
        </div>

        <div className="d-flex justify-content-between align-items-start flex-wrap mb-4">
          <div>
            <h2>Order #{order.order_number}</h2>
            <p className="text-muted">
              Placed on {format(new Date(order.created_at), 'PPP')}
            </p>
          </div>
          <div>
            <span className={`badge ${getStatusBadgeClass(order.status)} fs-6 px-3 py-2`}>
              {order.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            {/* Order Items */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Order Items</h5>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(item => (
                        <tr key={item.id}>
                          <td>
                            {item.product_name}
                            {item.variant_name && (
                              <div className="small text-muted">{item.variant_name}</div>
                            )}
                          </td>
                          <td>{item.quantity}</td>
                          <td>KSh {Number(item.unit_price).toLocaleString()}</td>
                          <td>KSh {Number(item.subtotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                        <td>KSh {Number(order.subtotal).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Delivery:</strong></td>
                        <td>KSh {Number(order.delivery_cost).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                        <td><strong>KSh {Number(order.total).toLocaleString()}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Order Timeline</h5>
                  <div className="timeline">
                    {order.status_history.map((history, index) => (
                      <div key={index} className="d-flex mb-3">
                        <div className="me-3">
                          <i className="bi bi-check-circle-fill text-success"></i>
                        </div>
                        <div>
                          <strong>{history.status?.replace('_', ' ').toUpperCase()}</strong>
                          <div className="text-muted small">
                            {format(new Date(history.created_at), 'PPP p')}
                          </div>
                          {history.note && (
                            <div className="small mt-1">{history.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            {/* Delivery Information */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Delivery Information</h5>
                {order.delivery_type === 'pickup' ? (
                  <div>
                    <p><strong>Pickup Station:</strong></p>
                    <p>{order.pickup_station?.name}</p>
                    <p className="text-muted small">{order.pickup_station?.address}</p>
                    <p><strong>Operating Hours:</strong> {order.pickup_station?.operating_hours}</p>
                  </div>
                ) : (
                  <div>
                    <p><strong>{order.shipping_full_name}</strong></p>
                    <p>{order.shipping_phone}</p>
                    <p>{order.shipping_street}</p>
                    <p>{order.shipping_town}</p>
                    <p>{order.shipping_county}</p>
                    {order.shipping_building && <p>{order.shipping_building}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Payment Information</h5>
                <p><strong>Method:</strong> {order.payment_method?.toUpperCase()}</p>
                <p><strong>Status:</strong> {order.payment_status}</p>
                {order.payment_status === 'success' && (
                  <div className="alert alert-success mt-2 mb-0">
                    <i className="bi bi-check-circle"></i> Payment confirmed
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Order Button */}
            {canCancel && (
              <div className="card">
                <div className="card-body">
                  <button
                    onClick={handleCancelOrder}
                    className="btn btn-danger w-100"
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-x-circle"></i> Cancel Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default OrderDetail