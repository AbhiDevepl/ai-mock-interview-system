import Image from "next/image";
import { getTechLogos } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DisplayTechIcons = async ({ techstack }: { techstack: string[] }) => {
  const techIcons = await getTechLogos(techstack);

  return (
    <div className="flex flex-row items-center">
      {techIcons.slice(0, 5).map(({ tech, url }, index) => (
        <div
          key={tech}
          className={cn(
            "relative group bg-dark-300 rounded-full p-2 flex-center",
            index >= 1 && "-ml-3"
          )}
        >
          <span className="tech-tooltip">{tech}</span>
          <Image
            src={url}
            alt={tech}
            width={22}
            height={22}
            className="size-5"
          />
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons;
