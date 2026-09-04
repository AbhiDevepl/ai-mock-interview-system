import React, { useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import {
  BsRobot,
  BsMic,
  BsClock,
  BsBarChart,
  BsFileEarmarkText,
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import AuthModel from "../components/AuthModel";
import { useNavigate } from "react-router-dom";
import evalImg from "../assets/ai-ans.png";
import resumeImg from "../assets/resume.png";
import pdfImg from "../assets/pdf.png";
import analyticsImg from "../assets/history.png";
import hrImg from "../assets/HR.png";
import techImg from "../assets/tech.png";
import confidenceImg from "../assets/confi.png";
import creditImg from "../assets/credit.png";
function Home() {
  const { userData } = useSelector((state) => state.user);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      icon: <BsRobot size={24} />,
      step: "1. Choose Role",
      title: "Select the role you want to practice for",
      description: "Select the role you want to practice for, and our AI will generate relevant interview questions."
    },
    {
      icon: <BsMic size={24} />,
      step: "2. Answer Questions",
      title: "Answer AI-generated questions",
      description: "Answer the AI-generated questions in a simulated interview environment, and receive real-time feedback."
    },
    {
      icon: <BsClock size={24} />,
      step: "3. Track Progress",
      title: "Track your progress over time",
      description: "Track your progress over time, and receive detailed performance insights to help you improve."
    }
  ];

  const capabilities = [
    {
      img: evalImg,
      icon: <BsBarChart size={20} />,
      title: "AI Evaluation",
      description:
        "Smart AI analyzes every response and provides expert-level feedback, scoring, and personalized coaching."
    },
    {
      img: resumeImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "Resume Analysis",
      description:
        "Optimize your resume for ATS systems and recruiters with AI-powered recommendations tailored to your target role."
    },
    {
      img: pdfImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "PDF Export",
      description:
        "Generate polished PDF reports containing interview results, feedback, and improvement recommendations."
    },
    {
      img: analyticsImg,
      icon: <BsBarChart size={20} />,
      title: "Performance Analytics",
      description:
        "Visualize your growth with comprehensive analytics, progress tracking, and skill-based performance insights."
    }
  ];

  const modes = [
    {
      img: hrImg,
      title: "HR Interview Mode",
      description:
        "Master behavioral and HR interviews with realistic questions, smart AI feedback, and actionable improvement suggestions."
    },
    {
      img: techImg,
      title: "Technical Interview Mode",
      description:
        "Experience realistic technical interviews covering coding, problem-solving, and technology-specific concepts for your target role."
    },
    {
      img: confidenceImg,
      title: "Confidence Interview Mode",
      description:
        "Build confidence with AI speech analysis, communication coaching, and detailed feedback on delivery, pace, and clarity."
    },
    {
      img: creditImg,
      title: "Credit Interview Mode",
      description:
        "Purchase and manage interview credits to access unlimited practice sessions and premium AI interview features."
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex flex-col">
      <div className="flex-1 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2
              rounded-full flex items-center gap-2">
              <HiSparkles size={16} className="text-green-600" />
              AI Powered Mock Interview System
            </div>
          </div>

          <div className="text-center mb-28">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-semibold leading-tight
              max-w-4xl mx-auto"
            >
              Practice Interviews with
              <span className='relative inline-block'>
                <span className="bg-green-100 text-green-600 px-5 py-1 rounded-full">
                  AI Intelligence
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-gray-500 mt-6 max-w-2xl mx-auto text-lg"
            >
              Role-based mock interviews with AI-generated questions, real-time feedback,
              and performance tracking to help you ace your next interview.
            </motion.p>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <motion.button
                onClick={() => {
                  if (!userData) {
                    setShowAuth(true);
                    return;
                  }
                  navigate("/interview");
                }}
                whileHover={{ opacity: 0.9, scale: 1.03 }}
                whileTap={{ opacity: 1, scale: 0.98 }}
                className="bg-black text-white px-10 py-3 rounded-full hover:opacity-90 transition shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Start Interview
              </motion.button>
              <motion.button
                onClick={() => {
                  if (!userData) {
                    setShowAuth(true);
                    return;
                  }
                  navigate("/history");
                }}
                whileHover={{ opacity: 0.9, scale: 1.03 }}
                whileTap={{ opacity: 1, scale: 0.98 }}
                className="border border-gray-300 px-10 py-3 rounded-full hover:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                View History
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-10 mb-28">
            {steps.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 + index * 0.2 }}
                whileHover={{ rotate: 0, scale: 1.06 }}
                key={index}
                className={`relative bg-white rounded-3xl border-2 border-green-100
                  hover:border-green-500 p-10 w-80 max-w-[90%] shadow-md
                  hover:shadow-2xl transition-all duration-300
                  ${index === 0 ? "rotate-[-4deg]" : ""}
                  ${index === 1 ? "rotate-[3deg] md:-mt-6 shadow-xl" : ""}
                  ${index === 2 ? "rotate-[-3deg]" : ""}`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2
                  border-green-500 text-green-600 w-16 h-16 rounded-2xl flex items-center
                  justify-center shadow-lg">
                  {item.icon}
                </div>
                <div className="pt-10 text-center">
                  <div className="text-xs text-green-600 font-semibold mb-2 tracking-wider">{item.step}</div>
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mb-32">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-semibold text-center mb-16"
            >
              Advance AI{" "}
              <span className="text-green-600">Capabilities</span>
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-10">
              {capabilities.map((item, index) => (
                <motion.div
                  className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all"
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 + index * 0.2 }}
                >
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/2 flex justify-center">
                      {/* PERFORMANCE OPTIMIZATION: Use native loading="lazy" for below-the-fold images to prevent fetching heavy assets (~1.3MB) on initial render, improving FCP and TTI. */}
                      <img
                        src={item.img}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-auto object-contain max-h-64"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-full md:w-1/2">
                      <div className="bg-green-50 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                        {item.icon}
                      </div>
                      <h3 className="font-semibold mb-3 text-xl">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mb-32">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-semibold text-center mb-16"
            >
              Multiple Interview{" "}
              <span className="text-green-600">Modes</span>
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-10">
              {modes.map((item, index) => (
                <motion.div
                  className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all"
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 + index * 0.2 }}
                  whileHover={{ y: -6 }}
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/2 flex justify-center">
                      {/* PERFORMANCE OPTIMIZATION: Use native loading="lazy" for below-the-fold images to prevent fetching heavy assets (~1.3MB) on initial render, improving FCP and TTI. */}
                      <img
                        src={item.img}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-auto object-contain max-h-48"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-full md:w-1/2">
                      <h3 className="font-semibold mb-3 text-xl">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
        </div>
      </div>
    </div>
  );
}

export default Home;
