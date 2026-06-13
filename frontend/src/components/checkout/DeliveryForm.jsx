import React, { useState, useEffect } from 'react'
import { deliveryAPI } from '../../services/api'

const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

const DeliveryForm = ({ formData, onChange, onDeliveryCostChange }) => {
  const [counties, setCounties] = useState([])
  const [pickupStations, setPickupStations] = useState([])
  const [loadingStations, setLoadingStations] = useState(false)

  useEffect(() => { fetchCounties() }, [])

  useEffect(() => {
    if (formData.deliveryType === 'pickup' && formData.countyId) {
      fetchPickupStations(formData.countyId)
    }
  }, [formData.deliveryType, formData.countyId])

  const fetchCounties = async () => {
    try {
      const res = await deliveryAPI.getCounties()
      setCounties(toArray(res.data))   // ← fix
    } catch {
      setCounties([])
    }
  }

  const fetchPickupStations = async (countyId) => {
    setLoadingStations(true)
    try {
      const res = await deliveryAPI.getPickupStations(countyId)
      setPickupStations(toArray(res.data))   // ← fix
    } catch {
      setPickupStations([])
    } finally {
      setLoadingStations(false)
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
      if (county) onDeliveryCostChange(parseFloat(county.home_delivery_cost))
    } else if (formData.deliveryType === 'pickup') {
      await fetchPickupStations(countyId)
    }
  }

  const handlePickupStationChange = (stationId) => {
    onChange('pickupStationId', stationId)
    const station = pickupStations.find(s => s.id === parseInt(stationId))
    if (station) onDeliveryCostChange(parseFloat(station.delivery_cost))
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--gray-150)',
      overflow: 'hidden',
      marginBottom: '1rem',
    }}>
      {/* Header */}
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
        <i className="bi bi-truck" style={{ color: 'var(--brand-red)' }}></i>
        Delivery Information
      </div>

      <div style={{ padding: '1.25rem' }}>

        {/* Delivery type toggle */}
        <div className="form-group">
          <label className="form-label">Delivery Method</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              { value: 'pickup', label: 'Pickup Station', icon: 'bi-shop' },
              { value: 'home',   label: 'Home Delivery',  icon: 'bi-house' },
            ].map(opt => (
              <label
                key={opt.value}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.75rem 1rem',
                  border: `1.5px solid ${formData.deliveryType === opt.value ? 'var(--brand-red)' : 'var(--gray-200)'}`,
                  borderRadius: 'var(--radius)',
                  background: formData.deliveryType === opt.value ? 'var(--brand-red-pale)' : 'white',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  fontWeight: formData.deliveryType === opt.value ? 600 : 400,
                  color: formData.deliveryType === opt.value ? 'var(--brand-red)' : 'var(--gray-700)',
                  fontSize: 'var(--text-sm)',
                }}
                onClick={() => handleDeliveryTypeChange(opt.value)}
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={formData.deliveryType === opt.value}
                  onChange={() => handleDeliveryTypeChange(opt.value)}
                  style={{ accentColor: 'var(--brand-red)' }}
                />
                <i className={`bi ${opt.icon}`}></i>
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* County */}
        <div className="form-group">
          <label className="form-label">
            County <span className="form-label-required">*</span>
          </label>
          <select
            className="form-control"
            value={formData.countyId || ''}
            onChange={e => handleCountyChange(e.target.value)}
          >
            <option value="">Select County</option>
            {counties.map(county => (
              <option key={county.id} value={county.id}>
                {county.name}
                {formData.deliveryType === 'home' && county.home_delivery_cost
                  ? ` — KSh ${Number(county.home_delivery_cost).toLocaleString()}`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Pickup station */}
        {formData.deliveryType === 'pickup' && formData.countyId && (
          <div className="form-group">
            <label className="form-label">
              Pickup Station <span className="form-label-required">*</span>
            </label>
            <select
              className="form-control"
              value={formData.pickupStationId || ''}
              onChange={e => handlePickupStationChange(e.target.value)}
              disabled={loadingStations}
            >
              <option value="">
                {loadingStations ? 'Loading stations…' : 'Select Pickup Station'}
              </option>
              {pickupStations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name} — KSh {Number(station.delivery_cost).toLocaleString()}
                </option>
              ))}
            </select>
            {!loadingStations && pickupStations.length === 0 && (
              <div className="form-hint">
                <i className="bi bi-info-circle" style={{ marginRight: '0.25rem' }}></i>
                No pickup stations available in this county.
              </div>
            )}
          </div>
        )}

        {/* Home delivery address */}
        {formData.deliveryType === 'home' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="form-label-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="John Kamau"
                  value={formData.shippingFullName || ''}
                  onChange={e => onChange('shippingFullName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Phone Number <span className="form-label-required">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="0712 345 678"
                  value={formData.shippingPhone || ''}
                  onChange={e => onChange('shippingPhone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Town / City <span className="form-label-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nairobi"
                  value={formData.shippingTown || ''}
                  onChange={e => onChange('shippingTown', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Street Address <span className="form-label-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="123 Moi Avenue"
                  value={formData.shippingStreet || ''}
                  onChange={e => onChange('shippingStreet', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Building / Apartment</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Westgate Mall, 3rd Floor"
                value={formData.shippingBuilding || ''}
                onChange={e => onChange('shippingBuilding', e.target.value)}
              />
              <div className="form-hint">Optional — helps the rider find you faster</div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default DeliveryForm