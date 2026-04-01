import React from 'react'
import { motion } from 'framer-motion'
import Home from './pages/Home'

function App() {
  return (
    <div className="App">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Home />
      </motion.div>
    </div>
  )
}

export default App
