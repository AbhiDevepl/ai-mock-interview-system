import React, { useState } from "react";
import { motion } from "motion/react";
import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../config";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
const MODES = [
  { id: "Technical", label: "Technical", icon: FaBriefcase },
  { id: "Behavioral", label: "Behavioral", icon: FaUserTie },
  { id: "System Design", label: "System Design", icon: FaChartLine },
];

function Step1SetUp({ onStart }) {
  const [loading, setLoading] = useState(false);
  const {userData}= useSelector((state)=>state.user);
  const dispatch = useDispatch();
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("Technical");
  const [errors, setErrors] = useState({});

  const handleModeKeyDown = (e) => {
    const currentIndex = MODES.findIndex((m) => m.id === mode);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % MODES.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + MODES.length) % MODES.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = MODES.length - 1;
    } else {
      return;
    }

    const nextMode = MODES[nextIndex].id;
    setMode(nextMode);
    setTimeout(() => {
      document.getElementById(`mode-btn-${nextMode}`)?.focus();
    }, 0);
  };
  const [resumeFile, setResumeFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState(null); // null | "success" | "error"
  const [analysisError, setAnalysisError] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const uploadTriggerRef = React.useRef(null);
  const modalRef = React.useRef(null);
  const closeBtnRef = React.useRef(null);

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setAnalysisStatus(null);
    setAnalysisError("");
  };

  React.useEffect(() => {
    if (!isUploadOpen) return;

    // Shift focus to the close button inside the modal when it opens
    if (closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeUploadModal();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        // Find all focusable elements inside the modal
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on the first element, wrap to the last
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab: if on the last element, wrap to the first
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    const currentTrigger = uploadTriggerRef.current;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the trigger button when the modal closes
      if (currentTrigger) {
        currentTrigger.focus();
      }
    };
  }, [isUploadOpen]);

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
    setAnalysisStatus(null);
    setAnalysisError("");
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const response = await axios.post(`${serverUrl}/api/resume/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      console.log("Resume analysis server data:", response.data);
      setAnalysisResult(response.data);
      const r = response.data?.role;
      const e = response.data?.experience;
      if (r && String(r).trim()) setRole(r);
      if (e && String(e).trim()) setExperience(e);
      setAnalysisStatus("success");
      setTimeout(() => {
        setIsUploadOpen(false);
      }, 1300);
    } catch (error) {
      console.error("Resume analysis failed:", error);
      console.log("Resume analysis server error data:", error.response?.data);
      setAnalysisStatus("error");
      setAnalysisError(
        error.response?.data?.message || "Failed to analyze resume. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const resumeText = analysisResult?.resumeText || "";
      const skills = analysisResult?.skills || [];
      const projects = analysisResult?.projects || [];
      const result = await axios.post(
        `${serverUrl}/api/interview/generate-question`,
        { role, experience, mode, resumeText, skills, projects },
        { withCredentials: true }
      );
      console.log(result.data);
      if (userData) {
        dispatch(setUserData({ ...userData, credits: result.data.creditLeft }));
      }
      setLoading(false);
      onStart(result.data);
    } catch (error) {
      console.log("generate-question error:", error.response?.data || error.message);
      setLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-emerald-50/80 px-4 py-6 sm:px-6"
    >
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-emerald-900/5 ring-1 ring-black/5 grid md:grid-cols-[0.85fr_1.15fr] overflow-hidden">
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-600 p-6 lg:p-10 flex flex-col justify-between text-white"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-green-300/20 blur-3xl"
          />

          <div className="relative">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              AI-Powered
            </span>

            <h2 className="mt-7 text-2xl sm:text-3xl font-bold leading-[1.15] tracking-tight">
              Start Your AI Interview
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-emerald-50/90 max-w-md">
              Practice real interview scenarios powered by AI. Improve
              communication, technical skills, and confidence.
            </p>
          </div>

          <div className="relative mt-8 space-y-3 w-full">
            {[
              {
                icon: <FaUserTie className="text-emerald-600 text-lg" />,
                text: "Choose Role & Experience",
              },
              {
                icon: <FaMicrophoneAlt className="text-emerald-600 text-lg" />,
                text: "Smart Voice Interview",
              },
              {
                icon: <FaChartLine className="text-emerald-600 text-lg" />,
                text: "Performance Analysis",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 + index * 0.15 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-lg shadow-emerald-900/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  {item.icon}
                </span>
                <span className="text-[15px] text-gray-700 font-medium">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="p-6 lg:p-10 bg-white overflow-y-auto"
        >
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">
              <span className="h-px w-6 bg-emerald-500" />
              Step 1 of 3
            </span>
            <h2 className="mt-3 text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">
              Interview Setup
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Configure your session and let's get you interview-ready.
            </p>
          </div>

          <div className="space-y-5">
            <div className="relative">
              <label htmlFor="target-role" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Target Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  id="target-role"
                  type="text"
                  placeholder="e.g., Frontend Developer, DevOps Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onBlur={() => validate()}
                  className={`w-full pl-11 pr-4 py-3 text-gray-800 placeholder:text-gray-400 border rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition ${errors.role ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                />
              </div>
              {errors.role && (
                <p className="mt-1.5 text-sm text-red-500" role="alert">{errors.role}</p>
              )}
            </div>

            <div>
              <label htmlFor="experience-level" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  id="experience-level"
                  type="text"
                  placeholder="e.g., 3 years, Senior, Mid-level"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  onBlur={() => validate()}
                  className={`w-full pl-11 pr-4 py-3 text-gray-800 placeholder:text-gray-400 border rounded-xl focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition ${errors.experience
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                    }`}
                />
              </div>
              {errors.experience && (
                <p className="mt-1.5 text-sm text-red-500" role="alert">{errors.experience}</p>
              )}
            </div>

            <div>
              <span id="interview-mode-label" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Interview Mode <span className="text-red-500">*</span>
              </span>
              <div
                className="grid grid-cols-3 gap-3"
                role="radiogroup"
                aria-labelledby="interview-mode-label"
              >
                {MODES.map((m) => {
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      id={`mode-btn-${m.id}`}
                      type="button"
                      onClick={() => setMode(m.id)}
                      onKeyDown={handleModeKeyDown}
                      role="radio"
                      aria-checked={isActive}
                      tabIndex={isActive ? 0 : -1}
                      className={`p-4 rounded-xl border-2 text-center transition-all duration-200 flex flex-col items-center gap-2.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 ${
                        isActive
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-gray-200 hover:border-emerald-300 text-gray-600"
                      }`}
                    >
                      <m.icon className="text-xl" />
                      <span className="font-medium text-sm">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="resume-upload-trigger" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Resume
              </label>
              <button
                id="resume-upload-trigger"
                ref={uploadTriggerRef}
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-left cursor-pointer transition-colors border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <FaFileUpload className="text-emerald-600" />
                </span>
                <span
                  className={`truncate font-medium ${
                    resumeFile ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {resumeFile ? resumeFile.name : "Upload Resume (Optional)"}
                </span>
              </button>
            </div>
          </div>
          {analysisStatus === "success" && analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border-gray-200 rounded-xl p-5 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                Resume Analysis Result
              </h3>
              {analysisResult.projects?.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">
                    Projects:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {analysisResult.projects.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisResult.skills?.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">
                    Skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.skills.map((s, i) => (
                      <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm" >{s}</span>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
          <div className="mt-6">
            <motion.button
              onClick={handleStart}
              disabled={!role || !experience || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                "Start Interview"
              )}
            </motion.button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Your session is private and secured.
            </p>
          </div>
        </motion.div>
      </div>

      {isUploadOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={closeUploadModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-resume-title"
            ref={modalRef}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
          >
            <button
              type="button"
              onClick={closeUploadModal}
              ref={closeBtnRef}
              aria-label="Close upload modal"
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full p-1"
            >
              <FaTimes size={18} />
            </button>

            <h3 id="upload-resume-title" className="text-lg font-bold tracking-tight text-gray-900">
              Upload Resume
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Attach your resume to personalize the interview.
            </p>

            <motion.div
              whileHover={analysisStatus === "success" ? undefined : { scale: 1.01 }}
              animate={{ scale: isDragging ? 1.02 : 1 }}
              onClick={
                analysisStatus === "success"
                  ? undefined
                  : () => document.getElementById("resumeUpload")?.click()
              }
              onKeyDown={(e) => {
                if (analysisStatus !== "success" && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  document.getElementById("resumeUpload")?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (analysisStatus !== "success") {
                  setIsDragging(true);
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (analysisStatus !== "success") {
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type === "application/pdf") {
                    setResumeFile(file);
                  }
                }
              }}
              role={analysisStatus === "success" ? undefined : "button"}
              tabIndex={analysisStatus === "success" ? undefined : 0}
              aria-label={
                analysisStatus === "success"
                  ? "Resume analyzed successfully"
                  : resumeFile
                  ? `Selected resume file: ${resumeFile.name}. Click or press Enter to change.`
                  : "Click, press Enter, or drag and drop to upload PDF resume"
              }
              className={`group mt-5 border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                analysisStatus === "success"
                  ? "border-emerald-300 bg-emerald-50/60"
                  : isDragging
                  ? "border-emerald-500 bg-emerald-50/60 shadow-lg shadow-emerald-500/10"
                  : "border-gray-300 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/60"
              }`}
            >
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
              {analysisStatus === "success" ? (
                <>
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                    <FaCheckCircle className="text-2xl text-emerald-600" />
                  </span>
                  <p className="mt-3 text-emerald-700 font-medium">
                    Resume analyzed successfully
                  </p>
                </>
              ) : (
                <>
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <FaFileUpload className="text-2xl text-emerald-600" />
                  </span>
                  <p className="mt-3 text-gray-700 font-medium">
                    {resumeFile
                      ? resumeFile.name
                      : "Click to upload resume (Optional)"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">PDF up to 5MB</p>
                  {resumeFile && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadResume();
                      }}
                      disabled={analyzing}
                      className="mt-4 min-h-[44px] bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {analyzing ? "Analyzing..." : "Analyze Resume"}
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>

            {analysisStatus === "error" && (
              <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {analysisError}
              </p>
            )}

            <button
              type="button"
              onClick={closeUploadModal}
              className="mt-5 w-full px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition cursor-pointer"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default Step1SetUp;