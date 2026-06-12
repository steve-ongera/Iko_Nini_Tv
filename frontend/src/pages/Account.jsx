import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileForm from '../components/account/ProfileForm'
import AddressBook from '../components/account/AddressBook'

const Account = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'bi-person' },
    { id: 'addresses', label: 'Addresses', icon: 'bi-geo-alt' },
    { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
  ]

  return (
    <>
      <Helmet>
        <title>My Account - Iko Nini TV</title>
      </Helmet>

      <div className="container">
        <h2 className="mb-4">My Account</h2>

        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="list-group">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`list-group-item list-group-item-action ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <i className={`bi ${tab.icon} me-2`}></i> {tab.label}
                </button>
              ))}
              <hr className="my-2" />
              <Link to="/orders" className="list-group-item list-group-item-action">
                <i className="bi bi-box-seam me-2"></i> My Orders
              </Link>
              <Link to="/wishlist" className="list-group-item list-group-item-action">
                <i className="bi bi-heart me-2"></i> Wishlist
              </Link>
              <button onClick={logout} className="list-group-item list-group-item-action text-danger">
                <i className="bi bi-box-arrow-right me-2"></i> Logout
              </button>
            </div>
          </div>

          <div className="col-lg-9">
            {activeTab === 'profile' && <ProfileForm />}
            {activeTab === 'addresses' && <AddressBook />}
            {activeTab === 'security' && <SecuritySettings />}
          </div>
        </div>
      </div>
    </>
  )
}

const SecuritySettings = () => {
  const { changePassword } = useAuth()
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.new_password !== formData.new_password2) {
      toast.error('New passwords do not match')
      return
    }
    
    setLoading(true)
    const result = await changePassword(
      formData.old_password,
      formData.new_password,
      formData.new_password2
    )
    setLoading(false)
    
    if (result.success) {
      setFormData({ old_password: '', new_password: '', new_password2: '' })
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-3">Change Password</h5>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-control"
              value={formData.old_password}
              onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              value={formData.new_password2}
              onChange={(e) => setFormData({ ...formData, new_password2: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Account