import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { selectUser } from "../redux/userSlice";
import { FaTimes } from "react-icons/fa";
import Auth from "../pages/Auth";

function AuthModel({ onClose }) {
  const userData = useSelector(selectUser);

  useEffect(() => {
    if (userData) {
      onClose();
    }
  }, [userData, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClose()}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-black cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <FaTimes size={18} />
        </button>
        <Auth isModal={true} />
      </div>
    </motion.div>
  );
}

export default AuthModel;
