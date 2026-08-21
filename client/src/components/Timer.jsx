import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft = 0, totalTime = 0 }) {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isWarning = timeLeft <= 10 && totalTime > 0;

  return (
    <div
      className="w-20 h-20"
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${timeLeft} seconds`}
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={totalTime}
    >
      <CircularProgressbar
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: isWarning ? "#ef4444" : "#10b981",
          textColor: isWarning ? "#ef4444" : "#111827",
          trailColor: "#e5e7eb",
        })}
      />
    </div>
  );
}

export default Timer;