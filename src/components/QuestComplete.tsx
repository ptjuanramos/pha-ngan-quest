import { missions } from "@/data/missions";

interface QuestCompleteProps {
  photos: Record<number, string>;
}

const QuestComplete = ({ photos }: QuestCompleteProps) => {
  return (
    <div className="min-h-screen px-6 py-16 fade-in">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl font-bold text-accent mb-4">
          Quest Complete! 🌴
        </h1>
        <p className="font-body text-base leading-relaxed text-foreground max-w-xs mx-auto">
          You explored Ko Pha Ngan, completed all 8 missions, and survived the
          spicy challenges!
        </p>
        <p className="font-body text-sm text-muted-foreground mt-3">
          Your adventure gallery awaits below.
        </p>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {missions.map((mission) => {
          const photo = photos[mission.id];
          if (!photo) return null;
          return (
            <div key={mission.id} className="relative overflow-hidden rounded-lg">
              <div className="aspect-square">
                <img
                  src={photo}
                  alt={`Mission ${mission.id}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 px-2 py-1">
                <p className="font-body text-xs text-primary-foreground truncate">
                  {mission.id}. {mission.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestComplete;
