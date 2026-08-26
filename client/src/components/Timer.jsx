import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft, totalTime }) {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isLowTime = timeLeft > 0 && timeLeft <= 10;
  const pathColor = isLowTime ? "#ef4444" : "#10b981";
  const textColor = isLowTime ? "#dc2626" : "#111827";

  return (
    <div
      className="w-20 h-20"
      role="timer"
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={totalTime}
      aria-valuetext={`${timeLeft} seconds remaining`}
      aria-live="polite"
    >
      <CircularProgressbar
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: pathColor,
          textColor: textColor,
          trailColor: "#e5e7eb",
        })}
      />
    </div>
  );
}

export default Timer;