import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft = 0, totalTime = 0 }) {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isWarning = totalTime > 0 && percentage <= 25;
  const activeColor = isWarning ? "#ef4444" : "#10b981";

  return (
    <div
      role="timer"
      aria-label="Interview countdown timer"
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={totalTime}
      aria-valuetext={`${timeLeft} seconds remaining`}
      aria-live="polite"
      className="w-20 h-20"
    >
      <CircularProgressbar
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: activeColor,
          textColor: activeColor,
          trailColor: "#e5e7eb",
        })}
      />
    </div>
  );
}

export default Timer;