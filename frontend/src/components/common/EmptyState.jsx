import React from 'react'
import { Link } from 'react-router-dom'

const EmptyState = ({ 
  title = 'Nothing to see here', 
  message = 'Your cart is empty', 
  icon = 'bi-cart',
  actionText = 'Start Shopping',
  actionLink = '/store'
}) => {
  return (
    <div className="text-center py-5 my-5">
      <i className={`bi ${icon} display-1 text-muted`}></i>
      <h3 className="mt-3">{title}</h3>
      <p className="text-muted">{message}</p>
      <Link to={actionLink} className="btn btn-primary mt-3">
        {actionText}
      </Link>
    </div>
  )
}

export default EmptyState