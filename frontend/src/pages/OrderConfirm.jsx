import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import Loader from '../components/common/Loader'
import { format } from 'date-fns'

const OrderConfirm = () => {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [orderNumber])

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.detail(orderNumber)
      setOrder(response.data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  if (!order) {
    return (
      <div className="container text-center py-5">
        <h3>Order not found</h3>
        <Link to="/orders" className="btn btn-primary mt-3">View My Orders</Link>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Order Confirmation - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <div className="text-center mb-5">
          <i className="bi bi-check-circle-fill text-success display-1"></i>
          <h2 className="mt-3">Thank You for Your Order!</h2>
          <p className="lead">Your order has been placed successfully.</p>
          <p className="text-muted">
            Order Number: <strong>{order.order_number}</strong>
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Order Status</h5>
                <div className="alert alert-success">
                  <i className="bi bi-clock-history"></i> Your order is <strong>{order.status}</strong>. 
                  You will receive an email confirmation shortly.
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Order Summary</h5>
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
                          <td>{item.product_name}</td>
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

            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Delivery Information</h5>
                {order.delivery_type === 'pickup' ? (
                  <div>
                    <p><strong>Pickup Station:</strong> {order.pickup_station?.name}</p>
                    <p><strong>Address:</strong> {order.pickup_station?.address}</p>
                    <p><strong>Operating Hours:</strong> {order.pickup_station?.operating_hours}</p>
                  </div>
                ) : (
                  <div>
                    <p><strong>Name:</strong> {order.shipping_full_name}</p>
                    <p><strong>Phone:</strong> {order.shipping_phone}</p>
                    <p><strong>Address:</strong> {order.shipping_street}, {order.shipping_town}</p>
                    <p><strong>County:</strong> {order.shipping_county}</p>
                    {order.shipping_building && <p><strong>Building:</strong> {order.shipping_building}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Payment Information</h5>
                <p><strong>Method:</strong> {order.payment_method?.toUpperCase()}</p>
                <p><strong>Status:</strong> {order.payment_status}</p>
                {order.payment_status === 'success' && (
                  <div className="alert alert-success mt-2">
                    Payment has been confirmed.
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <Link to="/orders" className="btn btn-outline-primary me-2">
                View All Orders
              </Link>
              <Link to="/store" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default OrderConfirm