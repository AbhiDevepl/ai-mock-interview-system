import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NavBar from "./components/NavBar";
import { setUserData } from "./redux/userSlice";

const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await api.get(ServerUrl + "/api/user/current-user");
        dispatch(setUserData(result.data));
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {!loading && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
              Dashboard Page — Coming Soon
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
              Profile Page — Coming Soon
            </div>
          }
        />
        <Route
          path="/interview"
          element={
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
              Interview Page — Coming Soon
            </div>
          }
        />
        <Route
          path="/history"
          element={
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
              History Page — Coming Soon
            </div>
          }
        />
        <Route
          path="/pricing"
          element={
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
              Pricing Page — Coming Soon
            </div>
          }
        />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;
