import React from "react";
import {buildStyles, CircularProgressbar} from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css'
import {build} from "vite";
function Timer({ timeLeft, totelTime }) {
  const percentage = (timeLeft/totelTime)*100
  return (
    <div className="w-20 h-20 ">
      <CircularProgressbar
      value={percentage}
      text={`${timeLeft}%`}
      styles={buildStyles({
      textSize: "28px",
        pathColor: "#10b981",
        textColor: "#ef4444",
        trailColor: "#e5e7eb",
      })}
      />

    </div>
  )
}
