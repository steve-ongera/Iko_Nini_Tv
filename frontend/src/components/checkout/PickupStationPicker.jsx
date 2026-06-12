import React, { useState, useEffect } from 'react'
import { deliveryAPI } from '../../services/api'

const PickupStationPicker = ({ selectedStationId, onSelect }) => {
  const [counties, setCounties] = useState([])
  const [selectedCounty, setSelectedCounty] = useState(null)
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCounties()
  }, [])

  useEffect(() => {
    if (selectedCounty) {
      fetchStations()
    }
  }, [selectedCounty])

  const fetchCounties = async () => {
    try {
      const response = await deliveryAPI.getCounties()
      setCounties(response.data)
    } catch (error) {
      console.error('Failed to fetch counties:', error)
    }
  }

  const fetchStations = async () => {
    setLoading(true)
    try {
      const response = await deliveryAPI.getPickupStations(selectedCounty.id)
      setStations(response.data)
    } catch (error) {
      console.error('Failed to fetch stations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-3">
        <label className="form-label">Select County</label>
        <select
          className="form-control"
          value={selectedCounty?.id || ''}
          onChange={(e) => {
            const county = counties.find(c => c.id === parseInt(e.target.value))
            setSelectedCounty(county)
            onSelect(null)
          }}
        >
          <option value="">Choose County</option>
          {counties.map(county => (
            <option key={county.id} value={county.id}>
              {county.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedCounty && (
        <div className="mb-3">
          <label className="form-label">Pickup Station</label>
          {loading ? (
            <div className="text-center py-3">
              <div className="loader" style={{ width: '30px', height: '30px' }}></div>
            </div>
          ) : (
            <div className="list-group">
              {stations.map(station => (
                <button
                  key={station.id}
                  className={`list-group-item list-group-item-action ${selectedStationId === station.id ? 'active' : ''}`}
                  onClick={() => onSelect(station.id)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{station.name}</strong>
                      <div className="small">{station.address}</div>
                    </div>
                    <span className="badge bg-primary">KSh {station.delivery_cost.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PickupStationPicker