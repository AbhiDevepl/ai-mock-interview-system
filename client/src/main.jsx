import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import { Provider } from 'react-redux'
import { store } from './redux/strore.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Provider store={store}>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Home />} />
      </Routes>
    </Provider>
    </BrowserRouter>
  </StrictMode>,
)
