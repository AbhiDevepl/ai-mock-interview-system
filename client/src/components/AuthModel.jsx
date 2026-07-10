import { useEffect } from "react";
import { useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import { selectUser, selectIsAuthenticated } from "../redux/userSlice";
import Auth from "../pages/Auth";

function AuthModel({ onClose }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userData = useSelector(selectUser);

  useEffect(() => {
    if (isAuthenticated && userData) {
      onClose();
    }
  }, [isAuthenticated, userData, onClose]);

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-8 right-5 text-gray-800 hover:text-black text-xl"
        >
          <FaTimes size={18} />
        </button>
        <Auth />
      </div>
    </div>
  );
}

export default AuthModel;
