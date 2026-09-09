import { useEffect, useRef, useState } from "react";
import femaleVideo from "../assets/Videos/female-ai.mp4?url";
import maleVideo from "../assets/Videos/male-ai.mp4?url";
import Timer from "./Timer.jsx";
import { motion } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import axios from "axios";
import { BsArrowRight } from "react-icons/bs";

const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

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
  // The candidate's turn: opens only once the AI has finished the question
  const [isAnswerPhase, setIsAnswerPhase] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

  // Browser callbacks (speech synthesis, recognition) outlive the render that
  // created them, so they must read live values through refs, not closures.
  const isAIPlayingRef = useRef(false);
  const isMicOnRef = useRef(true);
  const speechTokenRef = useRef(0);
  const suppressRestartRef = useRef(false);
  // The mic and the speech callbacks need the candidate's turn synchronously,
  // before the isAnswerPhase re-render lands.
  const isAnswerPhaseRef = useRef(false);
  // The voice is picked once; onvoiceschanged must not re-pick it mid-interview
  const voiceLockedRef = useRef(false);
  // Guards the one-submission-per-question rule across the Submit button and
  // the timer expiring in the same tick.
  const submitLockRef = useRef(false);

  const questions = interviewData?.questions || [];
  const interviewId = interviewData?.interviewId;
  const userName = interviewData?.userName;

  const currentQuestion = questions[currentIndex];

  const setAnswerPhase = (value) => {
    isAnswerPhaseRef.current = value;
    setIsAnswerPhase(value);
  };

  const totalQuestions = questions.length || 5;

  const [timeLeft, setTimeLeft] = useState(
    currentQuestion?.timeLimit || 60
  );

  const videoSource =
    voiceGender === "male" ? maleVideo : femaleVideo;

  // Load available browser voices
  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoice = () => {
      // Chrome fires onvoiceschanged more than once; re-selecting a voice would
      // change the effect dependency and make the current question repeat.
      if (voiceLockedRef.current) return;

      const voices = window.speechSynthesis.getVoices();

      if (!voices.length) return;

      voiceLockedRef.current = true;

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
          // "female" contains "male", so exclude it before matching
          (voice.name.toLowerCase().includes("male") &&
            !voice.name.toLowerCase().includes("female")) ||
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
  }, []);

  // Speak text using browser speech synthesis
  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      // Any utterance issued earlier is now stale and must not touch state
      const token = ++speechTokenRef.current;

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
        if (token !== speechTokenRef.current) return;

        isAIPlayingRef.current = true;
        setIsAIPlaying(true);
        setIsListening(false);

        stopMic();

        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      };

      const finishSpeaking = () => {
        // A newer utterance already took over the avatar and the mic
        if (token !== speechTokenRef.current) {
          resolve();
          return;
        }

        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        isAIPlayingRef.current = false;
        setIsAIPlaying(false);

        setSubtitle("");

        resolve();
      };

      utterance.onend = finishSpeaking;

      utterance.onerror = finishSpeaking;

      // Chrome stops speaking after ~15s unless resumed periodically
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);

      const clearKeepAlive = () => clearInterval(keepAlive);
      utterance.addEventListener("end", clearKeepAlive);
      utterance.addEventListener("error", clearKeepAlive);

      setSubtitle(text);

      // Chrome ignores speak() fired in the same tick as cancel()
      setTimeout(() => {
        if (token !== speechTokenRef.current) {
          clearInterval(keepAlive);
          resolve();
          return;
        }

        window.speechSynthesis.speak(utterance);
      }, 100);
    });
  };

  // Stop whatever the AI is saying and reset the avatar
  const cancelSpeech = () => {
    speechTokenRef.current++;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    isAIPlayingRef.current = false;
    setIsAIPlaying(false);
    setSubtitle("");
  };

  // Run introduction and questions
  useEffect(() => {
    // Without speech synthesis there is no voice to wait for; run the flow
    // silently instead of leaving the interview stuck on the intro phase.
    if (window.speechSynthesis && !selectedVoice) {
      return;
    }

    if (isFinished) return;

    let cancelled = false;

    // A new question always starts in the AI's turn, never the candidate's
    setAnswerPhase(false);
    stopMic();

    const runIntro = async () => {
      if (isIntroPhase) {
        const welcomeMessage = `${userName || "Candidate"}, welcome to the interview. I'm your AI interviewer.`;

        await speakText(welcomeMessage);
        if (cancelled) return;

        await speakText(
          "I'll ask you a series of questions. Please answer each question in a few sentences. Let's get started."
        );
        if (cancelled) return;

        setIsIntroPhase(false);
      } else if (currentQuestion) {
        await new Promise((resolve) =>
          setTimeout(resolve, 800)
        );
        if (cancelled) return;

        // If last question, make it harder
        if (currentIndex === questions.length - 1) {
          await speakText(
            "Alright, this one might be a bit more challenging."
          );
          if (cancelled) return;
        }

        await speakText(currentQuestion.question);
        if (cancelled) return;

        // The question has been fully spoken: hand the turn to the candidate,
        // which is what starts the timer.
        setAnswerPhase(true);

        if (isMicOnRef.current) {
          startMic();
        }
      }
    };

    runIntro();

    // Leaving this question (or a Strict Mode remount) must silence the
    // speech that belongs to it before the next one begins.
    return () => {
      cancelled = true;
      cancelSpeech();
    };
  }, [
    selectedVoice,
    currentIndex,
    isIntroPhase,
    isFinished,
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
    if (isAIPlaying) return;
    if (feedback) return;
    if (isFinished) return;
    // Nothing ticks until the AI has finished asking
    if (!isAnswerPhase) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIntroPhase, currentIndex, currentQuestion, isSubmitting, isAIPlaying, feedback, isFinished, isAnswerPhase]);

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

      // A denied microphone must not be retried in a loop
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        isMicOnRef.current = false;
        setIsMicOn(false);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);

      // Chrome ends recognition on its own after a pause; resume it so the
      // candidate can keep answering.
      if (
        !suppressRestartRef.current &&
        isMicOnRef.current &&
        !isAIPlayingRef.current
      ) {
        try {
          recognition.start();
        } catch (error) {
          // Already restarted
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      // stop() fires onend; without this the handler would restart a
      // recognition session that outlives the component.
      suppressRestartRef.current = true;

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
      !isAIPlayingRef.current &&
      isMicOnRef.current &&
      isAnswerPhaseRef.current
    ) {
      suppressRestartRef.current = false;

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
      // A deliberate stop must not be undone by the auto-restart in onend
      suppressRestartRef.current = true;

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
      isMicOnRef.current = false;
      setIsMicOn(false);
      setIsListening(false);
    } else {
      isMicOnRef.current = true;
      setIsMicOn(true);

      startMic();
    }
  };

  const submitAnswer = async () => {
    // Ref, not state: the Submit click and the timer hitting zero can land in
    // the same tick, before isSubmitting has re-rendered.
    if (submitLockRef.current) return;
    if (!currentQuestion) return;

    submitLockRef.current = true;

    setAnswerPhase(false);
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
            (currentQuestion.timeLimit || 60) - timeLeft,
        },{withCredentials: true}
      );

      // Showing feedback hands control to the "Next Question" button, which
      // is what advances currentIndex.
      setFeedback(
        result?.data?.feedback || "Answer submitted."
      );
    } catch (error) {
      console.error(
        "Error submitting answer:",
        error
      );

      // Never leave the interview stuck on an expired timer
      setFeedback(
        "We couldn't save that answer. You can continue to the next question."
      );
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };
  // Time is up: submit whatever the candidate has, using the normal path
  useEffect(() => {
    if (!isAnswerPhase) return;
    if (isFinished) return;
    if (feedback) return;
    if (timeLeft > 0) return;

    submitAnswer();
  }, [timeLeft, isAnswerPhase, isFinished, feedback]);

  const handleNext = async ()=> {
    setAnswer("")
    setFeedback("")

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }
    await speakText("Alright, let's move to the next question.");

    setCurrentIndex(currentIndex + 1);
  }

  const finishInterview = async () =>{
    if (submitLockRef.current) return;

    submitLockRef.current = true

    setIsFinished(true)
    setAnswerPhase(false)
    setIsSubmitting(true)

    stopMic()
    isMicOnRef.current = false
    setIsMicOn(false)
    cancelSpeech()

    try {
      const result = await axios.post(ServerUrl + "/api/interview/finish", {
        interviewId }, {withCredentials: true})

      if (onFinish) {
        onFinish(result?.data)
      }
    } catch (error) {
      console.error("Error finishing interview:", error)
    } finally {
      setIsSubmitting(false)
      submitLockRef.current = false
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
              loop
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

            <motion.button
              onClick={submitAnswer}
              disabled={isSubmitting || isAIPlaying || !isAnswerPhase || !answer.trim()}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:bg-gray-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </motion.button>

            {onFinish && (
              <motion.button
                onClick={finishInterview}
                disabled={isSubmitting}
                whileTap={{scale: 0.95}}
                className="ml-auto px-5 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition
              disabled:bg-gray-500">
                {isSubmitting?"Submitting...":
                "Finish"}
              </motion.button>
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