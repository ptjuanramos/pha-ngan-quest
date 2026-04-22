import { useState, useEffect, useCallback } from "react";
import { missions } from "@/data/missions";
import ProgressBar from "@/components/ProgressBar";
import WelcomeScreen from "@/components/WelcomeScreen";
import TreasureMap from "@/components/TreasureMap";
import MissionSheet from "@/components/MissionSheet";
import CompletedMissionModal from "@/components/CompletedMissionModal";
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
    const { photos, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    for (const [id, data] of Object.entries(photos)) {
      try {
        localStorage.setItem(`${STORAGE_KEY}-photo-${id}`, data);
      } catch {
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
      localStorage.setItem(
        `${STORAGE_KEY}-photo-${missionId}`,
        canvas.toDataURL("image/jpeg", 0.5)
      );
    } catch {}
  };
  img.src = dataUrl;
}

const Index = () => {
  const [state, setState] = useState<GameState>(loadState);
  const [openMissionId, setOpenMissionId] = useState<number | null>(null);
  const [reviewMissionId, setReviewMissionId] = useState<number | null>(null);
  const [signatureMoment, setSignatureMoment] = useState<{
    photo: string;
    clue: string;
    missionId: number;
  } | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleStart = () => {
    setState((s) => ({ ...s, started: true }));
  };

  const activeMissionId = state.completedCount + 1;

  const handleMarkerClick = useCallback(
    (missionId: number) => {
      if (state.photos[missionId]) {
        setReviewMissionId(missionId);
      } else if (missionId === activeMissionId) {
        setOpenMissionId(missionId);
      }
      // locked: no-op
    },
    [state.photos, activeMissionId]
  );

  const handlePhotoUpload = useCallback((missionId: number, photo: string) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return;
    setOpenMissionId(null);
    setSignatureMoment({ photo, clue: mission.clue, missionId });
  }, []);

  const handleSignatureComplete = useCallback(() => {
    if (!signatureMoment) return;
    const { missionId, photo } = signatureMoment;
    setState((s) => ({
      ...s,
      photos: { ...s.photos, [missionId]: photo },
      completedCount: s.completedCount + 1,
    }));
    setSignatureMoment(null);
  }, [signatureMoment]);

  const isComplete = state.completedCount >= missions.length;

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

  const openMission = openMissionId
    ? missions.find((m) => m.id === openMissionId)
    : null;
  const reviewMission = reviewMissionId
    ? missions.find((m) => m.id === reviewMissionId)
    : null;

  return (
    <div className="paper-texture min-h-screen">
      <ProgressBar completedMissions={state.completedCount} />

      <div className="pt-2">
        <TreasureMap
          completedCount={state.completedCount}
          photos={state.photos}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {openMission && (
        <MissionSheet
          mission={openMission}
          onClose={() => setOpenMissionId(null)}
          onPhotoUpload={handlePhotoUpload}
        />
      )}

      {reviewMission && (
        <CompletedMissionModal
          mission={reviewMission}
          photo={state.photos[reviewMission.id]}
          onClose={() => setReviewMissionId(null)}
        />
      )}

      {signatureMoment && (
        <SignatureMoment
          photo={signatureMoment.photo}
          clue={signatureMoment.clue}
          onComplete={handleSignatureComplete}
        />
      )}
    </div>
  );
};

export default Index;
