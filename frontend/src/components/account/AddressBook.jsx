import React, { useState, useEffect } from 'react'
import { addressAPI } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const AddressBook = () => {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    county: '',
    town: '',
    street: '',
    building: '',
    is_default: false,
  })
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.list()
      setAddresses(response.data)
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingAddress) {
        await addressAPI.update(editingAddress.id, formData)
        showSuccess('Address updated successfully')
      } else {
        await addressAPI.create(formData)
        showSuccess('Address added successfully')
      }
      
      fetchAddresses()
      resetForm()
    } catch (error) {
      showError('Failed to save address')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await addressAPI.delete(id)
        showSuccess('Address deleted')
        fetchAddresses()
      } catch (error) {
        showError('Failed to delete address')
      }
    }
  }

  const handleEdit = (address) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      county: address.county,
      town: address.town,
      street: address.street,
      building: address.building || '',
      is_default: address.is_default,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAddress(null)
    setFormData({
      label: 'Home',
      full_name: '',
      phone: '',
      county: '',
      town: '',
      street: '',
      building: '',
      is_default: false,
    })
  }

  if (loading) {
    return <div className="text-center py-5"><div className="loader"></div></div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Saved Addresses</h5>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            <i className="bi bi-plus"></i> Add Address
          </button>
        )}
      </div>
      
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h6>{editingAddress ? 'Edit Address' : 'Add New Address'}</h6>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Label</label>
                  <select
                    className="form-control"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">County</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Town/City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Street</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Building/Apartment (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                />
              </div>
              
              <div className="mb-3">
                <label className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  />
                  Set as default address
                </label>
              </div>
              
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingAddress ? 'Update' : 'Save'} Address
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-5">
          <i className="bi bi-geo-alt display-1 text-muted"></i>
          <p className="mt-2">No addresses saved yet</p>
        </div>
      ) : (
        addresses.map(address => (
          <div key={address.id} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="mb-1">
                    {address.label}
                    {address.is_default && (
                      <span className="badge bg-primary ms-2">Default</span>
                    )}
                  </h6>
                  <p className="mb-1">
                    <strong>{address.full_name}</strong><br />
                    {address.phone}<br />
                    {address.street}, {address.town}<br />
                    {address.county}
                    {address.building && <><br />{address.building}</>}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button onClick={() => handleEdit(address)} className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button onClick={() => handleDelete(address.id)} className="btn btn-sm btn-outline-danger">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default AddressBook