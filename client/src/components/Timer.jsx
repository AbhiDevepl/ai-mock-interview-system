import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft, totalTime }) {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isWarning = timeLeft <= 10 && totalTime > 10;
  const currentColor = isWarning ? "#ef4444" : "#10b981";

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={totalTime}
      aria-valuetext={`${timeLeft} seconds remaining`}
      className="w-20 h-20"
    >
      <CircularProgressbar
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: currentColor,
          textColor: isWarning ? "#ef4444" : "#111827",
          trailColor: "#e5e7eb",
        })}
      />
    </div>
  );
}

export default Timer;
