import { useEffect } from "react";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { motion } from "motion/react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  setUserData,
  setLoading,
  setError,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
} from "../redux/userSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { appConfig } from "../config";
import axios from "axios";

const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function Auth({ isModal = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Selectors
  const loading = useSelector(selectIsLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userData = useSelector(selectUser);

  useEffect(() => {
    if (isAuthenticated && userData) {
      const from = location.state?.from || "/";
      navigate(from);
    }
  }, [isAuthenticated, userData, navigate, location.state]);

  const handleGoogleAuth = async () => {
    try {
      dispatch(setLoading(true));
      const response = await signInWithPopup(auth, provider);
      const User = response.user;
      const name = User.displayName;
      const photo = User.photoURL;

      const idToken = await User.getIdToken();
      const result = await axios.post(ServerUrl + "/api/auth/google",
        { idToken, name, photo }, { withCredentials: true });
      dispatch(setUserData(result.data));
    } catch (error) {
      console.log(error);
      dispatch(setError(error.message));
      dispatch(setUserData(null));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && userData) {
    return null;
  }

  return (
    <div
      className={`w-full ${!isModal ? "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        role={isModal ? "dialog" : undefined}
        aria-modal={isModal ? true : undefined}
        aria-labelledby="auth-title"
        className={`mx-auto w-full ${isModal ? "max-w-md px-6 py-8 sm:p-8 rounded-3xl shadow-lg bg-white" : "max-w-2xl px-6 py-10 sm:p-12 rounded-3xl shadow-lg bg-white"}`}
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>
          <h2 id="auth-title" className="font-semibold text-lg tracking-tight">
            {appConfig.name}
          </h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug tracking-tight mb-5">
          Continue with
          <span className="ml-1 bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2 align-middle font-medium">
            AI Smart Interview <IoSparkles size={16} />
          </span>
        </h1>

        <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto">
          Sign in to start AI-powered mock interviews, track your progress, and
          unlock detailed performance insights.
        </p>

        <motion.button
          type="button"
          onClick={handleGoogleAuth}
          whileHover={{ opacity: 0.9, scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Continue with Google"
          className="w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md font-medium select-none transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <FcGoogle size={20} />
          Continue with Google
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Auth;
