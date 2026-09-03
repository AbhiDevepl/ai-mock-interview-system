import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft = 0, totalTime = 0 }) {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isWarning = totalTime > 0 && (timeLeft <= 10 || percentage <= 20);

  const pathColor = isWarning ? "#ef4444" : "#10b981";
  const textColor = isWarning ? "#ef4444" : "#059669";

  return (
    <div
      role="timer"
      aria-label="Interview countdown timer"
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={totalTime}
      aria-live="polite"
      className="w-20 h-20"
    >
      <CircularProgressbar
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor,
          textColor,
          trailColor: "#e5e7eb",
        })}
      />
    </div>
  );
}

export default Timer;
