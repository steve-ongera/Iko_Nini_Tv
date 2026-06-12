import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import Loader from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import { format } from 'date-fns'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.list()
      setOrders(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
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

  const getStatusText = (status) => {
    return status?.replace('_', ' ').toUpperCase() || status
  }

  if (loading) {
    return <Loader />
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No Orders Yet"
        message="You haven't placed any orders yet. Start shopping!"
        icon="bi-box-seam"
        actionText="Start Shopping"
        actionLink="/store"
      />
    )
  }

  return (
    <>
      <Helmet>
        <title>My Orders - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <h2 className="mb-4">My Orders</h2>

        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="list-group">
              <Link to="/account" className="list-group-item list-group-item-action">
                <i className="bi bi-person me-2"></i> Profile
              </Link>
              <Link to="/orders" className="list-group-item list-group-item-action active">
                <i className="bi bi-box-seam me-2"></i> Orders
              </Link>
              <Link to="/wishlist" className="list-group-item list-group-item-action">
                <i className="bi bi-heart me-2"></i> Wishlist
              </Link>
              <Link to="/account/addresses" className="list-group-item list-group-item-action">
                <i className="bi bi-geo-alt me-2"></i> Addresses
              </Link>
            </div>
          </div>

          <div className="col-lg-9">
            {orders.map(order => (
              <div key={order.id} className="card mb-3">
                <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap">
                  <div>
                    <strong>Order #{order.order_number}</strong>
                    <span className="text-muted ms-3">
                      {format(new Date(order.created_at), 'PPP')}
                    </span>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      {order.items.slice(0, 2).map(item => (
                        <div key={item.id} className="d-flex justify-content-between mb-2">
                          <span>
                            {item.product_name} x {item.quantity}
                          </span>
                          <span>KSh {Number(item.subtotal).toLocaleString()}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-muted small">
                          +{order.items.length - 2} more items
                        </div>
                      )}
                    </div>
                    <div className="col-md-4 text-md-end">
                      <div className="mb-2">
                        <strong>Total: </strong>
                        <span className="text-primary fs-5">
                          KSh {Number(order.total).toLocaleString()}
                        </span>
                      </div>
                      <Link to={`/orders/${order.order_number}`} className="btn btn-sm btn-outline-primary">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Orders