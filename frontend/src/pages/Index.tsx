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
    const base = raw ? JSON.parse(raw) : { started: false, completedCount: 0 };
    const photos: Record<number, string> = {};
    for (let i = 1; i <= 8; i++) {
      const photo = localStorage.getItem(`${STORAGE_KEY}-photo-${i}`);
      if (photo) photos[i] = photo;
    }
    return { ...base, photos };
  } catch {}
  return { started: false, photos: {}, completedCount: 0 };
}

function saveState(state: GameState) {
  try {
    // Save progress without photos (photos stored individually)
    const { photos, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    // Store each photo separately
    for (const [id, data] of Object.entries(photos)) {
      try {
        localStorage.setItem(`${STORAGE_KEY}-photo-${id}`, data);
      } catch {
        // If quota exceeded, store as compressed thumbnail
        compressAndStore(Number(id), data);
      }
    }
  } catch {}
}

function compressAndStore(missionId: number, dataUrl: string) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const maxDim = 400;
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
      localStorage.setItem(`${STORAGE_KEY}-photo-${missionId}`, canvas.toDataURL("image/jpeg", 0.5));
    } catch {}
  };
  img.src = dataUrl;
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
