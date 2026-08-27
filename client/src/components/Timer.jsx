import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft = 0, totalTime = 0 }) {
  const validTimeLeft = Math.max(0, Number(timeLeft) || 0);
  const validTotalTime = Math.max(0, Number(totalTime) || 0);
  const percentage = validTotalTime > 0 ? (validTimeLeft / validTotalTime) * 100 : 0;
  const isLowTime = validTimeLeft <= 10 && validTimeLeft > 0;

  return (
    <div
      role="timer"
      aria-label="Interview timer"
      aria-live="polite"
      aria-valuenow={validTimeLeft}
      aria-valuemin={0}
      aria-valuemax={validTotalTime}
      aria-valuetext={`${validTimeLeft} seconds remaining`}
      className="w-20 h-20"
    >
      <CircularProgressbar
        value={percentage}
        text={`${validTimeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: isLowTime ? "#ef4444" : "#10b981",
          textColor: isLowTime ? "#dc2626" : "#047857",
          trailColor: "#e5e7eb",
        })}
      />
    </div>
  );
}

export default Timer;