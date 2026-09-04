import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { setUserData } from "./redux/userSlice";
import InterviewPage from "./pages/InterviewPage.jsx";
const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/user/current-user", { withCredentials: true });
        dispatch(setUserData(result.data));
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    getUser();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/interview" element={< InterviewPage/>} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
