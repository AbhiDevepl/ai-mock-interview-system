import React from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { selectUser } from "../redux/userSlice";

function NavBar() {
  const { userData } = useSelector(selectUser);
  return (
    <div className='bg-[#f3f3f3] flex justify-center px-4 pt-6'>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200
        px-8 py-4 flex items-center relative justify-between">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="bg-black text-white p-2 rounded-lg">
            <h1>InterviewIQ.AI</h1>

          </div>

        </div>

      </motion.div>
    </div>
  );
}

export default NavBar;
