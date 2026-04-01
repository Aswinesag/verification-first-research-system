import React from 'react'

const SimpleTest = () => {
  return (
    <div style={{
      backgroundColor: '#0a0a0f',
      color: '#e8e8e8',
      padding: '20px',
      borderRadius: '10px',
      margin: '20px'
    }}>
      <h1 style={{ color: '#00ff88' }}>Simple Test Component</h1>
      <p>If you can see this, React is working!</p>
      <button 
        style={{
          backgroundColor: '#00ff88',
          color: '#0a0a0f',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </button>
    </div>
  )
}

export default SimpleTest
