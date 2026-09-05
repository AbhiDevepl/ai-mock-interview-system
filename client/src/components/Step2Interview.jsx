import React, { useEffect, useRef, useState } from "react";
import femaleVideo from "../assets/Videos/female-ai.mp4?url";
import maleVideo from "../assets/Videos/male-ai.mp4?url";
import Timer from "./Timer.jsx";
import { motion } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import axios from "axios";
import { BsArrowLeft } from "react-icons/bs";

function Step2Interview({ interviewData = null, onFinish = null }) {
  const [isListening, setIsListening] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

  const questions = interviewData?.questions || [];
  const interviewId = interviewData?.interviewId;
  const userName = interviewData?.userName;

  const currentQuestion = questions[currentIndex];

  const totalQuestions = questions.length || 5;

  const [timeLeft, setTimeLeft] = useState(
    currentQuestion?.timeLimit || 60
  );

  const videoSource =
    voiceGender === "male" ? maleVideo : femaleVideo;

  // Load available browser voices
  useEffect(() => {
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      if (!voices.length) return;

      // Try to find a female voice
      const femaleVoice = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes("female") ||
          voice.name.toLowerCase().includes("samantha") ||
          voice.name.toLowerCase().includes("siri") ||
          voice.name.toLowerCase().includes("zira")
      );

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }

      // Try to find a male voice
      const maleVoice = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes("male") ||
          voice.name.toLowerCase().includes("david") ||
          voice.name.toLowerCase().includes("eric") ||
          voice.name.toLowerCase().includes("alex")
      );

      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      // If no specific voice is found, use the default voice
      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoice();

    window.speechSynthesis.onvoiceschanged = loadVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [currentIndex]);

  // Speak text using browser speech synthesis
  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // Add natural pauses for punctuation
      const humanText = text
        .replace(/,/g, ", ...")
        .replace(/\./g, ". .")
        .replace(/\?/g, "? .")
        .replace(/\!/g, "! .")
        .replace(/\;/g, "; .")
        .replace(/\:/g, ": .")
        .replace(/"/g, '" .')
        .replace(/'/g, "' .")
        .replace(/\(/g, "( .");

      const utterance = new SpeechSynthesisUtterance(humanText);

      utterance.voice = selectedVoice;

      // Humanize speech
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsAIPlaying(true);
        setIsListening(false);

        stopMic();

        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      };

      utterance.onend = () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);

        setSubtitle("");

        if (isMicOn) {
          startMic();
        }

        resolve();
      };

      utterance.onerror = () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);
        resolve();
      };

      setSubtitle(text);

      window.speechSynthesis.speak(utterance);
    });
  };

  // Run introduction and questions
  useEffect(() => {
    if (!selectedVoice) {
      return;
    }

    const runIntro = async () => {
      if (isIntroPhase) {
        const welcomeMessage = `${userName || "Candidate"}, welcome to the interview. I'm your AI interviewer.`;

        await speakText(welcomeMessage);

        await speakText(
          "I'll ask you a series of questions. Please answer each question in a few sentences. Let's get started."
        );

        setIsIntroPhase(false);
      } else if (currentQuestion) {
        await new Promise((resolve) =>
          setTimeout(resolve, 800)
        );

        // If last question, make it harder
        if (currentIndex === questions.length - 1) {
          await speakText(
            "Alright, this one might be a bit more challenging."
          );
        }

        await speakText(currentQuestion.question);

        if (isMicOn) {
          startMic();
        }
      }
    };

    runIntro();
  }, [
    selectedVoice,
    currentIndex,
    isIntroPhase,
  ]);

  // Reset timer whenever question changes
  useEffect(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 60);
    }
  }, [currentIndex, currentQuestion]);

  // Question timer
  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;
    if(isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    useEffecte(()=>{
      if (!isIntroPhase && currentQuestion) {
        setTimeLeft(currentQuestion.timeLeft || 60);
      }
    },[currentIndex])

    return () => clearInterval(timer);
  }, [isIntroPhase, currentIndex, currentQuestion, isSubmitting]);

  // Speech recognition setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    const recognition =
      new window.webkitSpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const lastResult =
        event.results[event.results.length - 1];

      if (!lastResult) return;

      const transcript =
        lastResult[0]?.transcript?.trim();

      if (!transcript) return;

      setAnswer((prev) =>
        prev ? `${prev} ${transcript}` : transcript
      );
    };

    recognition.onerror = (event) => {
      console.warn(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        // Recognition may already be stopped
      }

      recognitionRef.current = null;
    };
  }, []);

  const startMic = () => {
    if (
      recognitionRef.current &&
      !isAIPlaying &&
      isMicOn
    ) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        // Browser throws if recognition is already running
        console.warn(
          "Speech recognition could not start:",
          error
        );
      }
    }
  };

  const stopMic = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Recognition may already be stopped
      }

      setIsListening(false);
    }
  };

  const toggleMic = () => {
    if (isMicOn) {
      stopMic();
      setIsMicOn(false);
      setIsListening(false);
    } else {
      setIsMicOn(true);

      if (!isAIPlaying) {
        setTimeout(() => {
          startMic();
        }, 100);
      }
    }
  };

  const submitAnswer = async () => {
    if (isSubmitting) return;
    if (!currentQuestion) return;

    stopMic();
    setIsSubmitting(true);

    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/submit-answer",
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken:
            (currentQuestion.timeLimit) - timeLeft,
        },{withCreadentials:true}
      );

      setFeedback(
        result?.data?.feedback || ""
      );

      // Move to next question
      if (currentIndex < questions.length - 1) {
        setAnswer("");
        setFeedback("");
        setCurrentIndex((prev) => prev + 1);
      } else {
        if (onFinish) {
          onFinish(result?.data);
        }
      }
    } catch (error) {
      console.error(
        "Error submitting answer:",
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleNext = async ()=> {
    setAnswer("")
    setFeedback("")

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }
    await speakText("Alright, let's move to the next question.");

    setCurrentIndex(currentIndex + 1);
    setTimeout(()=>{
      if (isMicOn) startMic();
    },500);
  }

  const finishInterview = async () =>{
    stopMic()
    setIsMicOn(false)
    try {
      const result = await axios.post(ServerUrl + "/api/interview/finish", {
        interviewId }, {withCreadentials:true})
    } catch (error) {
      
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[1400px] min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        {/* Left Section */}
        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">

          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
            />
          </div>

          {subtitle && (
            <div className="text-sm text-gray-500 mt-2">
              <p className="text-center text-gray-700 text-sm sm:text-base font-medium leading-relaxed">
                {subtitle}
              </p>
            </div>
          )}

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Interview Status
              </span>

              {isAIPlaying && (
                <span className="text-sm font-semibold text-emerald-600">
                  AI Speaking...
                </span>
              )}
            </div>

            <div className="h-px bg-gray-200"></div>

            <div className="flex justify-center">
              <Timer
                timeLeft={timeLeft}
                totalTime={
                  currentQuestion?.timeLimit || 60
                }
              />
            </div>

            <div className="h-px bg-gray-200"></div>

            <div className="grid grid-cols-2 gap-6 text-center">

              <div>
                <span className="text-2xl font-bold text-emerald-600 block">
                  {currentIndex + 1}
                </span>

                <span className="text-xs text-gray-400">
                  Current Question
                </span>
              </div>

              <div>
                <span className="text-2xl font-bold text-emerald-600 block">
                  {totalQuestions}
                </span>

                <span className="text-xs text-gray-400">
                  Total Questions
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">

          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">
            AI Smart Interview
          </h2>

          <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">

            <p className="text-xs sm:text-sm text-gray-400 mb-2">
              Question {currentIndex + 1} of{" "}
              {totalQuestions}
            </p>

            <div className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed pr-16">
              {currentQuestion?.question ||
                "Waiting for question..."}
            </div>

          </div>

          <textarea
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder="Type Your Answer Here..."
            className="flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800"
          />

          {!feedback ? (<div className="flex items-center gap-4 mt-6">

            <motion.button
              onClick={toggleMic}
              whileTap={{ scale: 0.9 }}
              className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shadow-lg transition-colors ${
                isListening
                  ? "bg-emerald-600"
                  : "bg-black"
              } text-white`}
            >
              {isMicOn ? (
                <FaMicrophone size={20} />
              ) : (
                <FaMicrophoneSlash size={20} />
              )}
            </motion.button>

            {onFinish && (
              <button
                onClick={onFinish}
                disabled={isSubmitting}
                whileTap={{scale: 0.95}}
                className="ml-auto px-5 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition
              disabled:bg-gray-500">
                {isSubmitting?"Submitting...":
                "Finish"}
              </button>
            )}

          </div>):(
              <motion.div
              initial={{opacity:0}}
              animate={{opacity:1}}
              className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm"
              >
                <p className="text-emerald-700 font-medium mb-4">
                  {feedback}
                </p>
                <button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 
                rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1">
                  Next Question <BsArrowRight size={18}/>
                </button>
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Step2Interview;