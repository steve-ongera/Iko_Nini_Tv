import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import AddressBook from '../../components/account/AddressBook'

const Addresses = () => {
  return (
    <>
      <Helmet>
        <title>My Addresses - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <h2 className="mb-4">My Addresses</h2>

        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="list-group">
              <Link to="/account" className="list-group-item list-group-item-action">
                <i className="bi bi-person me-2"></i> Profile
              </Link>
              <Link to="/orders" className="list-group-item list-group-item-action">
                <i className="bi bi-box-seam me-2"></i> Orders
              </Link>
              <Link to="/wishlist" className="list-group-item list-group-item-action">
                <i className="bi bi-heart me-2"></i> Wishlist
              </Link>
              <Link to="/account/addresses" className="list-group-item list-group-item-action active">
                <i className="bi bi-geo-alt me-2"></i> Addresses
              </Link>
            </div>
          </div>

          <div className="col-lg-9">
            <AddressBook />
          </div>
        </div>
      </div>
    </>
  )
}

export default Addresses