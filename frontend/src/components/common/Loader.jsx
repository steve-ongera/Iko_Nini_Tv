import React from 'react'

const Loader = ({ size = 'medium', fullScreen = false }) => {
  const sizeMap = {
    small: '30px',
    medium: '50px',
    large: '70px',
  }

  const spinner = (
    <div className="d-flex justify-content-center align-items-center">
      <div 
        className="loader" 
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      ></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white" style={{ zIndex: 9999 }}>
        {spinner}
      </div>
    )
  }

  return spinner
}

export default Loader