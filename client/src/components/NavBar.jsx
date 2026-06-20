import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "motion/react";
import { BsRobot } from "react-icons/bs";
import { FaUserAstronaut } from "react-icons/fa";
import { FaCoins } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import {
  clearUser,
  selectUser,
  selectIsAuthenticated,
} from "../redux/userSlice";
import AuthModel from "./AuthModel";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import api from "../utils/axios";

const NavBar = () => {
  const userData = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showCreditsPopup, setShowCreditsPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const credits = userData?.credits ?? 0;
  const [showAuth, setShowAuth] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await api.post("api/auth/logout");
      dispatch(clearUser());
      setShowCreditsPopup(false);
      setShowUserPopup(false);
      navigate("/auth");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-[#f3f3f3] flex justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-6xl bg-white rounded-24px shadow-sm
                           border-2 border-gray-200 px-8 py-4 flex justify-between items-center relative mx-auto"
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-black text-white p-2 rounded-lg"
            onClick={() => navigate("/")}
          >
            <BsRobot size={18} />
          </motion.div>
          <h1 className="font-semibold hidden md:block text-lg">
            AI Mock Interview
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!isAuthenticated || !userData) {
                  setShowAuth(true);
                  return;
                }

                setShowCreditsPopup(!showCreditsPopup);
                setShowUserPopup(false);
              }}
              className="hidden md:flex items-center gap-2 bg-gradient-to from-indigo-100 to-purple-100
                        text-indigo-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-indigo-200"
            >
              <FaCoins />
              <span className="font-semibold">{credits}</span>
            </motion.button>

            {showCreditsPopup && (
              <div className="absolute right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded-lg p-4 z-20">
                <p className="text-sm text-gray-600 mb-4">
                  You have {credits} credits remaining. Each mock interview
                  session costs 25 credits.
                </p>
                <button
                  onClick={() => {
                    setShowCreditsPopup(false);
                    navigate("/pricing");
                  }}
                  className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300 text-sm"
                >
                  Buy More Credits
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!isAuthenticated || !userData) {
                  setShowAuth(true);
                  return;
                }
                setShowUserPopup(!showUserPopup);
                setShowCreditsPopup(false);
              }}
              className="relative bg-white p-2 rounded-full border-2 border-gray-200 group-hover:border-purple-400 transition-colors duration-300"
            >
              {userData ? (
                <FaUserAstronaut
                  className="text-gray-700 group-hover:text-purple-600 transition-colors duration-300"
                  size={18}
                />
              ) : (
                <FaUserAstronaut className="text-gray-400" size={18} />
              )}
            </motion.button>

            {showUserPopup && (
              <div className="absolute right-0 mt-3 w-48 bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50">
                {userData ? (
                  <>
                    <p className="text-md text-blue-500 font-semibold mb-1">
                      {userData?.name}
                    </p>
                    <button
                      onClick={() => navigate("/history")}
                      className="w-full text-left text-sm py-2 hover:text-black
                                            text-gray-600"
                    >
                      Interview History
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-sm py-2 flex items-center gap-2 text-red-500"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300 text-sm"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
          </div>
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default NavBar;
