import React, { useState, useEffect } from 'react'
import { deliveryAPI } from '../../services/api'

const DeliveryForm = ({ formData, onChange, onDeliveryCostChange }) => {
  const [counties, setCounties] = useState([])
  const [pickupStations, setPickupStations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCounties()
  }, [])

  useEffect(() => {
    if (formData.deliveryType === 'pickup' && formData.countyId) {
      fetchPickupStations(formData.countyId)
    }
  }, [formData.deliveryType, formData.countyId])

  const fetchCounties = async () => {
    try {
      const response = await deliveryAPI.getCounties()
      setCounties(response.data)
    } catch (error) {
      console.error('Failed to fetch counties:', error)
    }
  }

  const fetchPickupStations = async (countyId) => {
    setLoading(true)
    try {
      const response = await deliveryAPI.getPickupStations(countyId)
      setPickupStations(response.data)
    } catch (error) {
      console.error('Failed to fetch pickup stations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeliveryTypeChange = (type) => {
    onChange('deliveryType', type)
    onChange('pickupStationId', null)
    onChange('countyId', null)
    onDeliveryCostChange(0)
  }

  const handleCountyChange = async (countyId) => {
    onChange('countyId', countyId)
    
    if (formData.deliveryType === 'home') {
      const county = counties.find(c => c.id === parseInt(countyId))
      if (county) {
        onDeliveryCostChange(parseFloat(county.home_delivery_cost))
      }
    } else if (formData.deliveryType === 'pickup') {
      await fetchPickupStations(countyId)
    }
  }

  const handlePickupStationChange = (stationId) => {
    onChange('pickupStationId', stationId)
    const station = pickupStations.find(s => s.id === parseInt(stationId))
    if (station) {
      onDeliveryCostChange(parseFloat(station.delivery_cost))
    }
  }

  const handleAddressChange = (field, value) => {
    onChange(field, value)
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-3">Delivery Information</h5>
        
        <div className="mb-3">
          <label className="form-label">Delivery Method</label>
          <div className="d-flex gap-3">
            <label className="d-flex align-items-center gap-2">
              <input
                type="radio"
                value="pickup"
                checked={formData.deliveryType === 'pickup'}
                onChange={() => handleDeliveryTypeChange('pickup')}
              />
              Pickup Station
            </label>
            <label className="d-flex align-items-center gap-2">
              <input
                type="radio"
                value="home"
                checked={formData.deliveryType === 'home'}
                onChange={() => handleDeliveryTypeChange('home')}
              />
              Home Delivery
            </label>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">County</label>
          <select
            className="form-control"
            value={formData.countyId || ''}
            onChange={(e) => handleCountyChange(e.target.value)}
          >
            <option value="">Select County</option>
            {counties.map(county => (
              <option key={county.id} value={county.id}>
                {county.name}
              </option>
            ))}
          </select>
        </div>
        
        {formData.deliveryType === 'pickup' && formData.countyId && (
          <div className="mb-3">
            <label className="form-label">Pickup Station</label>
            <select
              className="form-control"
              value={formData.pickupStationId || ''}
              onChange={(e) => handlePickupStationChange(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Pickup Station</option>
              {pickupStations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name} - KSh {station.delivery_cost.toLocaleString()}
                </option>
              ))}
            </select>
            {pickupStations.length === 0 && !loading && (
              <small className="text-muted">No pickup stations available in this county</small>
            )}
          </div>
        )}
        
        {formData.deliveryType === 'home' && (
          <>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.shippingFullName || ''}
                  onChange={(e) => handleAddressChange('shippingFullName', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.shippingPhone || ''}
                  onChange={(e) => handleAddressChange('shippingPhone', e.target.value)}
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
                  value={formData.shippingTown || ''}
                  onChange={(e) => handleAddressChange('shippingTown', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.shippingStreet || ''}
                  onChange={(e) => handleAddressChange('shippingStreet', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Building/Apartment (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={formData.shippingBuilding || ''}
                onChange={(e) => handleAddressChange('shippingBuilding', e.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DeliveryForm