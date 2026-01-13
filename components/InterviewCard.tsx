import React from "react";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";

import { getRandomInterviewCover } from "@/lib/utils";
import type { InterviewCardProps, Feedback } from "@/types";

import DisplayTechIcons from "./DisplayTechIcons";
import { Button } from "./ui/button";

const InterviewCard = ({
  interviewId,
  role,
  type,
  techstack,
  createdAt,
  feedback = null,
}: InterviewCardProps & { feedback?: Feedback | null }) => {
  const normalizedType =
    type.toLowerCase() === "mix" ? "Mixed" : type;

  const dateSource = createdAt ?? feedback?.createdAt;

  const formattedDate = dateSource
    ? dayjs(dateSource).format("MMM D, YYYY")
    : "---";

  const cover = React.useMemo(
    () => getRandomInterviewCover(),
    []
  );

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          {/* Interview Type Badge */}
          <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-light-600">
            <p className="badge-text">{normalizedType}</p>
          </div>

          {/* Cover Image */}
          <Image
            src={cover}
            alt="interview cover"
            width={90}
            height={90}
            className="rounded-full object-cover size-[90px]"
          />

          {/* Title */}
          <h3 className="mt-5 capitalize">{role} Interview</h3>

          {/* Meta Info */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image
                src="/calendar.svg"
                alt="calendar"
                width={22}
                height={22}
              />
              <p className="badge-text">{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2">
              <Image
                src="/star.svg"
                alt="score"
                width={22}
                height={22}
              />
              <p className="badge-text">
                {feedback?.totalScore ?? "---"}/100
              </p>
            </div>
          </div>

          {/* Assessment */}
          <p className="line-clamp-2 mt-5">
            {feedback?.finalAssessment ??
              "You have not taken this interview yet. Take it to receive your score and feedback."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-row justify-between items-center">
          <DisplayTechIcons techstack={techstack} />

          <Button asChild className="btn-primary">
            <Link href={`/interview/${interviewId}`}>
              {feedback ? "Check Interview" : "Take Interview"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;