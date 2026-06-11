import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { BsRobot } from "react-icons/bs";
import { FaUserAstronaut } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { selectUser, selectIsAuthenticated } from "../redux/userSlice";

const Home = () => {
  const userData = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-black text-white p-3 rounded-xl">
              <BsRobot size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              AI Mock Interview
            </h1>
          </div>

          <p className="text-lg text-gray-600 mb-8">
            Practice your interview skills with AI-powered mock interviews.
          </p>

          {isAuthenticated && userData ? (
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <FaUserAstronaut className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-800">
                  Welcome back, {userData.name}!
                </p>
                <p className="text-sm text-gray-500">
                  You have {userData.credits} credits remaining.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Practice Interviews
              </h2>
              <p className="text-gray-600 mb-4">
                Get instant feedback on your answers with AI-powered analysis.
              </p>
              <button
                onClick={() => navigate("/interview")}
                className="text-blue-600 font-medium hover:underline"
              >
                Start Practicing
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Track Progress
              </h2>
              <p className="text-gray-600 mb-4">
                Review your interview history and performance metrics.
              </p>
              <button
                onClick={() => navigate("/history")}
                className="text-blue-600 font-medium hover:underline"
              >
                View History
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
