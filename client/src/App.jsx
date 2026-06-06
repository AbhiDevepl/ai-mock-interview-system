import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import axios from "axios";

export const serverUrl =
  import.meta.env.VITE_SERVER_URL
    ? import.meta.env.VITE_SERVER_URL.replace(/\/$/, "") + "/"
    : (import.meta.env.MODE === "development" ? "http://localhost:8000/" : "http://localhost:8000/");

function App() {
  const [user, setUser] = useState(null);
  useEffect(()=>{
    const getUser = async() => {
      try {
        const result = await axios.get(serverUrl + "api/user/current-user",{withCredentials:true})
        console.log(result.data)
      } catch (error) {
        console.log(error)
      }
    }
    getUser()
  },[])
  return (
    <Routes>
      <Route path="/" element={<Home user={user} />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;