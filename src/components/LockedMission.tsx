import { Lock } from "lucide-react";

interface LockedMissionProps {
  missionNumber: number;
  isSpicy: boolean;
}

// Abstract SVG patterns for locked missions
const patterns = [
  // Leaf pattern
  `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q45 20 30 55 Q15 20 30 5Z' fill='none' stroke='%2300525A' stroke-width='0.5' opacity='0.15'/%3E%3C/svg%3E")`,
  // Wave pattern
  `url("data:image/svg+xml,%3Csvg width='80' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q20 0 40 20 Q60 40 80 20' fill='none' stroke='%2300525A' stroke-width='0.5' opacity='0.12'/%3E%3C/svg%3E")`,
  // Sand dots
  `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%2300525A' opacity='0.08'/%3E%3C/svg%3E")`,
  // Crossed lines
  `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='40' y2='40' stroke='%2300525A' stroke-width='0.3' opacity='0.1'/%3E%3Cline x1='40' y1='0' x2='0' y2='40' stroke='%2300525A' stroke-width='0.3' opacity='0.1'/%3E%3C/svg%3E")`,
];

const LockedMission = ({ missionNumber, isSpicy }: LockedMissionProps) => {
  const patternIndex = (missionNumber - 1) % patterns.length;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundImage: patterns[patternIndex] }}
    >
      <div className="flex flex-col items-center gap-4 opacity-40">
        <Lock
          size={32}
          className={isSpicy ? "text-accent" : "text-foreground"}
        />
        <span className="font-heading text-lg font-semibold tracking-wide text-foreground">
          Mission {missionNumber}
        </span>
      </div>
    </div>
  );
};

export default LockedMission;
