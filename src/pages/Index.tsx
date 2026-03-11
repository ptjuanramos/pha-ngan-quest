import { useState, useEffect, useCallback, useRef } from "react";
import { missions } from "@/data/missions";
import ProgressBar from "@/components/ProgressBar";
import WelcomeScreen from "@/components/WelcomeScreen";
import ActiveMission from "@/components/ActiveMission";
import LockedMission from "@/components/LockedMission";
import CompletedMission from "@/components/CompletedMission";
import SignatureMoment from "@/components/SignatureMoment";
import QuestComplete from "@/components/QuestComplete";

const STORAGE_KEY = "kpn-quest";

interface GameState {
  started: boolean;
  photos: Record<number, string>;
  completedCount: number;
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { started: false, photos: {}, completedCount: 0 };
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const Index = () => {
  const [state, setState] = useState<GameState>(loadState);
  const [signatureMoment, setSignatureMoment] = useState<{
    photo: string;
    clue: string;
    missionId: number;
  } | null>(null);

  const missionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleStart = () => {
    setState((s) => ({ ...s, started: true }));
  };

  const handlePhotoUpload = useCallback(
    (missionId: number, photo: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;

      setSignatureMoment({ photo, clue: mission.clue, missionId });
    },
    []
  );

  const handleSignatureComplete = useCallback(() => {
    if (!signatureMoment) return;
    const { missionId, photo } = signatureMoment;

    setState((s) => ({
      ...s,
      photos: { ...s.photos, [missionId]: photo },
      completedCount: s.completedCount + 1,
    }));
    setSignatureMoment(null);

    // Scroll to next mission
    const nextId = missionId + 1;
    setTimeout(() => {
      missionRefs.current[nextId]?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }, [signatureMoment]);

  const isComplete = state.completedCount >= missions.length;
  const currentMissionId = state.completedCount + 1;

  if (!state.started) {
    return (
      <div className="paper-texture min-h-screen">
        <WelcomeScreen onStart={handleStart} />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="paper-texture min-h-screen">
        <ProgressBar completedMissions={state.completedCount} />
        <div className="pt-2">
          <QuestComplete photos={state.photos} />
        </div>
      </div>
    );
  }

  return (
    <div className="paper-texture min-h-screen">
      <ProgressBar completedMissions={state.completedCount} />

      {signatureMoment && (
        <SignatureMoment
          photo={signatureMoment.photo}
          clue={signatureMoment.clue}
          onComplete={handleSignatureComplete}
        />
      )}

      <div className="pt-2">
        {missions.map((mission) => {
          const isCompleted = !!state.photos[mission.id];
          const isActive = mission.id === currentMissionId;
          const isLocked = mission.id > currentMissionId;

          return (
            <div
              key={mission.id}
              ref={(el) => { missionRefs.current[mission.id] = el; }}
            >
              {isCompleted ? (
                <CompletedMission mission={mission} photo={state.photos[mission.id]} />
              ) : isActive ? (
                <ActiveMission mission={mission} onPhotoUpload={handlePhotoUpload} />
              ) : isLocked ? (
                <LockedMission missionNumber={mission.id} isSpicy={mission.isSpicy} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Index;
