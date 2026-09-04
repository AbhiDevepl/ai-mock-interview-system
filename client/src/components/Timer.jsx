import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft = 0, totalTime = 0 }) {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isLowTime = timeLeft <= 10 && totalTime > 10;

  const pathColor = isLowTime ? "#ef4444" : "#10b981";
  const textColor = isLowTime ? "#dc2626" : "#047857";

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${timeLeft} seconds`}
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={totalTime}
      aria-live="polite"
      className="w-20 h-20 flex items-center justify-center"
    >
      <CircularProgressbar
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: pathColor,
          textColor: textColor,
          trailColor: "#e5e7eb",
          pathTransitionDuration: 0.5,
        })}
      />
    </div>
  );
}

export default Timer;
