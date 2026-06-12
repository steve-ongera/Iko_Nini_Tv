import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 text-center py-5">
            <i className="bi bi-emoji-frown display-1 text-muted"></i>
            <h1 className="display-1 fw-bold text-primary">404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/" className="btn btn-primary btn-lg">
              <i className="bi bi-house-door"></i> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound