import { Check } from "lucide-react";
import type { Mission } from "@/data/missions";

interface CompletedMissionProps {
  mission: Mission;
  photo: string;
}

const CompletedMission = ({ mission, photo }: CompletedMissionProps) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Photo */}
        <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg">
          <img
            src={photo}
            alt={`Mission ${mission.id} proof`}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Check size={16} className="text-primary-foreground" />
          </div>
        </div>

        <p className="font-body text-sm text-muted-foreground text-center">
          Missão {mission.id} — {mission.title}
        </p>
      </div>
    </div>
  );
};

export default CompletedMission;
