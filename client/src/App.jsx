import { useEffect, useRef } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";
import {
  initializeAuth,
  clearUser,
  selectIsInitialized,
  selectIsLoading,
} from "./redux/userSlice";
import { setupAxiosInterceptors } from "./utils/axios";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const initialized = useSelector(selectIsInitialized);
  const loading = useSelector(selectIsLoading);
  const initStarted = useRef(false);

  // === Auth Initialization State Machine ===
  // Phase 0: App mounts, nothing has happened yet.
  // Phase 1: On first mount, dispatch initializeAuth (which uses api with withCredentials: true baked in).
  // Phase 2: If the /me call succeeds, user is authenticated; if it fails (401), user is a guest.
  // The SplashScreen renders until initialized === true.
  useEffect(() => {
    if (!initStarted.current) {
      initStarted.current = true;
      dispatch(initializeAuth());
    }
  }, [dispatch]);

  // === Axios 401 Interceptor ===
  // When any API call returns 401 (not auth-related),
  // clear user state and redirect to /auth.
  useEffect(() => {
    setupAxiosInterceptors(() => {
      dispatch(clearUser());
      navigate("/auth", { replace: true });
    });
  }, [dispatch, navigate]);

  if (!initialized) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {!loading && <NavBar />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
                Dashboard Page — Coming Soon
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
                Profile Page — Coming Soon
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
                Interview Page — Coming Soon
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
                History Page — Coming Soon
              </div>
            </ProtectedRoute>
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
