import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'


 // add production url in .env file and use it here demo of export const serverUrl = "import.meta.env.VITE_SERVER_URL"
export const serverUrl = "http://localhost:8000/api/auth || http://localhost:8001/api/auth"

const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App