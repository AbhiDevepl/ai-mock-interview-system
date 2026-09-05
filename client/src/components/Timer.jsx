import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft = 0, totalTime = 0 }) {
  // A countdown can tick past zero or arrive as NaN mid-transition; clamp once
  // so the ring, the label and the aria values never disagree.
  const validTimeLeft = Number.isFinite(timeLeft) ? Math.max(0, Math.ceil(timeLeft)) : 0;
  const validTotalTime = Number.isFinite(totalTime) ? Math.max(0, totalTime) : 0;

  const percentage =
    validTotalTime > 0 ? Math.min(100, (validTimeLeft / validTotalTime) * 100) : 0;
  const isLowTime = validTimeLeft > 0 && validTimeLeft <= 5;

  return (
    <div
      role="timer"
      aria-valuenow={validTimeLeft}
      aria-valuemin={0}
      aria-valuemax={validTotalTime}
      aria-valuetext={`${validTimeLeft} seconds remaining`}
      aria-live="polite"
      className="w-20 h-20"
    >
      <CircularProgressbar
        value={percentage}
        text={`${validTimeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: isLowTime ? "#ef4444" : "#10b981",
          textColor: isLowTime ? "#ef4444" : "#10b981",
          trailColor: "#e5e7eb",
          pathTransitionDuration: 0.5,
        })}
      />
    </div>
  );
}

export default Timer;
