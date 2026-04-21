import { missions } from "@/data/missions";

interface ProgressBarProps {
  completedMissions: number;
}

const ProgressBar = ({ completedMissions }: ProgressBarProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-1.5 bg-secondary">
      {missions.map((_, i) => (
        <div
          key={i}
          className="h-full flex-1 transition-colors duration-500"
          style={{
            backgroundColor:
              i < completedMissions
                ? missions[i].isSpicy
                  ? "hsl(var(--accent))"
                  : "hsl(var(--primary))"
                : "transparent",
            borderRight: i < missions.length - 1 ? "1px solid hsl(var(--background))" : "none",
          }}
        />
      ))}
    </div>
  );
};

export default ProgressBar;
