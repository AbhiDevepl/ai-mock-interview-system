import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { selectUser, setUserData } from "../redux/userSlice";
import { FaUserAstronaut } from "react-icons/fa";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthModel from "./AuthModel";

const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function NavBar() {
  const { userData } = useSelector(selectUser);
  const [showCreditsPopup, setShowCreditsPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + "/api/auth/logout", { withCredentials: true });
      dispatch(setUserData(null));
      setShowCreditsPopup(false);
      setShowUserPopup(false);
      navigate("/auth");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className='bg-[#f3f3f3] flex justify-center px-4 pt-6'>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200
        px-8 py-4 flex items-center relative justify-between"
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>
          <h1 className="font-semibold hidden md:block text-lg">
            InterviewIQ.AI
          </h1>
        </div>

        <div className="flex items-center gap-6 relative">
          <div className="relative">
            <button
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowCreditsPopup(!showCreditsPopup);
                setShowUserPopup(false);
              }}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-md hover:bg-gray-200 transition"
            >
              <BsCoin size={20} />
              {userData?.credits || 0}
            </button>
            {showCreditsPopup && (
              <div className="absolute right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200
                rounded-2xl p-5 z-50">
                <p className="text-sm text-gray-600 mb-4">
                  Need more credits? You can purchase additional credits to continue your AI-powered mock interviews and unlock detailed performance insights.
                </p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full bg-black text-white py-2 rounded-lg text-sm"
                >
                  Buy More Credits
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowUserPopup(!showUserPopup);
                setShowCreditsPopup(false);
              }}
              className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center
              font-semibold"
            >
              {userData?.name ? userData.name.slice(0, 1).toUpperCase() : <FaUserAstronaut size={18} />}
            </button>
            {showUserPopup && (
              <div className="absolute right-0 mt-3 w-48 bg-white shadow-xl border border-gray-200
                rounded-xl p-4 z-50">
                <p className="text-md text-gray-800 font-medium mb-2">
                  {userData?.name || "User"}
                </p>
                <button
                  onClick={() => navigate("/history")}
                  className="w-full text-left text-sm py-2 hover:text-blue-500 text-gray-600"
                >
                  Interview History
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm py-2 flex items-center gap-2 text-red-500 hover:text-red-600"
                >
                  <HiOutlineLogout size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}

    </div>
  );
}

export default NavBar;