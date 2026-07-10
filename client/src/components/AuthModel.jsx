import React, { useEffect } from "react";
import { useSelector } from "react-redux";
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

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/10 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-8 right-5 text-gray-800 hover:text-black text-xl"
        >
          <FaTimes size={18} />
        </button>
        <Auth isModal={true} />
      </div>
    </div>
  );
}

export default AuthModel;
