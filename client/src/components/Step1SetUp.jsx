import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../config";

const MODES = [
  { id: "Technical", label: "Technical", icon: FaBriefcase },
  { id: "Behavioral", label: "Behavioral", icon: FaUserTie },
  { id: "System Design", label: "System Design", icon: FaChartLine },
];

const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry Level (0-2 years)" },
  { id: "mid", label: "Mid Level (3-5 years)" },
  { id: "senior", label: "Senior (6-10 years)" },
  { id: "lead", label: "Lead/Principal (10+ years)" },
];

function Step1SetUp({ onStart }) {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("Technical");
  const [errors, setErrors] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!role.trim()) newErrors.role = "Role is required";
    if (!experience) newErrors.experience = "Experience level is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUploadResume = async () => {
    if (!resumeFile) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      await axios.post(`${serverUrl}/api/resume/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      alert("Resume analyzed successfully!");
    } catch (error) {
      console.error("Resume analysis failed:", error);
      alert("Failed to analyze resume. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStart = () => {
    if (validate()) {
      onStart({ role, experience, mode, resumeFile });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4"
    >
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden">
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col items-center"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Start Your AI Interview
          </h2>
          <p className="text-gray-700 mb-10 text-center">
            Practice real interview scenarios powered by AI. Improve
            communication, technical skills, and confidence.
          </p>
          <div className="space-y-5 w-full max-w-md">
            {[
              {
                icon: <FaUserTie className="text-green-600 text-xl" />,
                text: "Choose Role & Experience",
              },
              {
                icon: <FaMicrophoneAlt className="text-green-600 text-xl" />,
                text: "Smart Voice Interview",
              },
              {
                icon: <FaChartLine className="text-green-600 text-xl" />,
                text: "Performance Analysis",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 + index * 0.15 }}
                whileHover={{ scale: 1.03 }}
                className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm cursor-pointer"
              >
                {item.icon}
                <span className="text-gray-700 font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="p-12 bg-white overflow-y-auto"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Interview Setup
          </h2>

          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="e.g., Frontend Developer, DevOps Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onBlur={() => validate()}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${
                    errors.role ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                onBlur={() => validate()}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition appearance-none bg-white ${
                  errors.experience
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <option value="">Select experience level</option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
              {errors.experience && (
                <p className="mt-1 text-sm text-red-500">{errors.experience}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`p-4 rounded-xl border-2 text-center transition flex flex-col items-center gap-2 ${
                      mode === m.id
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-green-300 text-gray-700"
                    }`}
                  >
                    <m.icon className="text-xl" />
                    <span className="font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resume upload - always visible */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => document.getElementById("resumeUpload")?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
            >
              <FaFileUpload className="text-4xl mx-auto text-green-600 mb-3" />
              <input
                type="file"
                id="resumeUpload"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setResumeFile(file);
                }}
              />
              <p className="text-gray-600 font-medium">
                {resumeFile
                  ? resumeFile.name
                  : "Click to upload resume (Optional)"}
              </p>
              {resumeFile && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadResume();
                  }}
                  disabled={analyzing}
                  className="mt-4 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {analyzing ? "Analyzing..." : "Analyze Resume"}
                </motion.button>
              )}
            </motion.div>
          </div>

          <motion.button
            onClick={handleStart}
            disabled={!role || !experience}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 w-full px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Start Interview
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Step1SetUp;
