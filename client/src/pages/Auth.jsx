import React from "react";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { motion } from 'motion/react';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from '../utils/firebase';
import axios from "axios";
import { serverUrl } from "../App";

function Auth() {
  const handleGoogleAuth = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      
      const user = response.user;
      const idToken = await user.getIdToken();

      // Security: Sending verified ID token instead of raw user data
      const result = await axios.post(`${serverUrl}api/auth/google`, {
        idToken
      }, {
        withCredentials: true 
      });

      console.log("Server Response:", result.data);
      
    } catch (error) {
      console.error("Auth Error:", error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.05 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>
          <h2 className="font-semibold text-lg">InterviewIQ_AI</h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">
          Continue with{" "}
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2">
            AI Smart Interview <IoSparkles size={16} />
          </span>
        </h1>

        <h2 className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8">
          Sign in to start AI-powered mock interviews, track your progress, and unlock detailed performance insights.
        </h2>

        <motion.button
          onClick={handleGoogleAuth}
          whileHover={{ opacity: 0.9, scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md">
          <FcGoogle size={20} />
          Continue with Google
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Auth;
