import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import {
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
} from "../redux/userSlice";
import SplashScreen from "./SplashScreen";

function ProtectedRoute({ children }) {
  const userData = useSelector(selectUser);
  const loading = useSelector(selectIsLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (loading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated || !userData) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
