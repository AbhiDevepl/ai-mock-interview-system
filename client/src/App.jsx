import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice.js'
import axios from 'axios'
import { useEffect } from 'react'



 // add production url in .env file and use it here demo of export const serverUrl = "import.meta.env.VITE_SERVER_URL"
export const serverUrl = import.meta.env.VITE_SERVER_URL

const App = () => {

  const dispatch = useDispatch()

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current-user`, {
          withCredentials: true
        })
        dispatch(setUserData(result.data))
      } catch (error) {
        dispatch(setUserData(null))
      }
    }
    getUser()
  }, [dispatch]);
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