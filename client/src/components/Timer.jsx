import React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Timer({ timeLeft = 0, totalTime = 0 }) {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isWarning = timeLeft <= 10 && totalTime > 10;
  const currentColor = isWarning ? "#ef4444" : "#10b981";

  const isCritical = timeLeft <= 5 || (totalTime > 0 && percentage <= 15);
  const isWarning = !isCritical && (timeLeft <= 15 || (totalTime > 0 && percentage <= 30));

  const statusColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";

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
        text={`${validTimeLeft}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: currentColor,
          textColor: isWarning ? "#ef4444" : "#111827",
          trailColor: "#e5e7eb",
          pathTransitionDuration: 0.5,
        })}
      />
    </div>
  );
}

export default Timer;
