import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'


 // add production url in .env file and use it here demo of export const serverUrl = "import.meta.env.VITE_SERVER_URL"
export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8001"

const App = () => {
  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current-user`, {
          withCredentials: true
        })
        console.log(result.data)
      } catch (error) {
        console.log(error)
      }
    }
    getUser()
  }, []);
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