import { useState, useEffect, useCallback, useRef } from "react";
import ProgressBar from "@/components/ProgressBar";
import WelcomeScreen from "@/components/WelcomeScreen";
import TreasureMap from "@/components/TreasureMap";
import MissionSheet from "@/components/MissionSheet";
import CompletedMissionModal from "@/components/CompletedMissionModal";
import SignatureMoment from "@/components/SignatureMoment";
import QuestComplete from "@/components/QuestComplete";
import { missionsService } from "@/services";
import type { MissionResponse } from "@/services/types";

const STORAGE_KEY = "kpn-quest";

interface UiState {
  started: boolean;
}

function loadUiState(): UiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { started: false };
  } catch {
    return { started: false };
  }
}

function saveUiState(state: UiState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const Index = () => {
  const [ui, setUi] = useState<UiState>(loadUiState);
  const [missions, setMissions] = useState<MissionResponse[]>([]);
  /** In-memory cache of resolved photo data URLs, keyed by missionId. */
  const [photoCache, setPhotoCache] = useState<Record<number, string>>({});
  const [openMissionId, setOpenMissionId] = useState<number | null>(null);
  const [reviewMissionId, setReviewMissionId] = useState<number | null>(null);
  const [signatureMoment, setSignatureMoment] = useState<{
    photo: string;
    clue: string;
    missionId: number;
  } | null>(null);

  const inflightPhotoFetches = useRef<Set<number>>(new Set());

  useEffect(() => {
    saveUiState(ui);
  }, [ui]);

  // Load missions from the service on mount.
  useEffect(() => {
    const controller = new AbortController();
    missionsService
      .loadAll(controller.signal)
      .then(setMissions)
      .catch(() => {
        /* swallow for mock */
      });
    return () => controller.abort();
  }, []);

  // Lazy-fetch photo data only when the cache is empty for a completed mission.
  useEffect(() => {
    missions.forEach((m) => {
      if (
        m.photoUrl &&
        photoCache[m.id] === undefined &&
        !inflightPhotoFetches.current.has(m.id)
      ) {
        inflightPhotoFetches.current.add(m.id);
        missionsService
          .fetchPhoto(m.photoUrl)
          .then((dataUrl) => {
            if (dataUrl) {
              setPhotoCache((c) => ({ ...c, [m.id]: dataUrl }));
            }
          })
          .finally(() => inflightPhotoFetches.current.delete(m.id));
      }
    });
  }, [missions, photoCache]);

  const completedCount = missions.filter((m) => m.isComplete).length;
  const activeMissionId = completedCount + 1;
  const isComplete = missions.length > 0 && completedCount >= missions.length;

  const handleStart = () => setUi((s) => ({ ...s, started: true }));

  const handleMarkerClick = useCallback(
    (missionId: number) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;
      if (mission.isComplete) {
        setReviewMissionId(missionId);
      } else if (missionId === activeMissionId) {
        setOpenMissionId(missionId);
      }
    },
    [missions, activeMissionId]
  );

  const handlePhotoUpload = useCallback(
    async (missionId: number, photo: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;
      try {
        const upload = await missionsService.uploadPhoto(missionId, {
          dataUrl: photo,
        });
        await missionsService.complete(missionId, { photoId: upload.photoId });
        // Optimistically update local state — acts as the cache.
        setPhotoCache((c) => ({ ...c, [missionId]: photo }));
        setMissions((list) =>
          list.map((m) =>
            m.id === missionId
              ? { ...m, isComplete: true, photoUrl: upload.photoUrl }
              : m
          )
        );
        setOpenMissionId(null);
        setSignatureMoment({ photo, clue: mission.clue, missionId });
      } catch {
        // surface as upload failure — caller already handled UI states; no-op here
      }
    },
    [missions]
  );

  const handleSignatureComplete = useCallback(() => {
    setSignatureMoment(null);
  }, []);

  if (!ui.started) {
    return (
      <div className="paper-texture min-h-screen">
        <WelcomeScreen onStart={handleStart} />
      </div>
    );
  }

  if (missions.length === 0) {
    // initial load
    return <div className="paper-texture min-h-screen" />;
  }

  if (isComplete) {
    return (
      <div className="paper-texture min-h-screen">
        <ProgressBar completedMissions={completedCount} />
        <div className="pt-2">
          <QuestComplete photos={photoCache} />
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
      <ProgressBar completedMissions={completedCount} />

      <div className="pt-2">
        <TreasureMap
          missions={missions}
          completedCount={completedCount}
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

      {reviewMission && photoCache[reviewMission.id] && (
        <CompletedMissionModal
          mission={reviewMission}
          photo={photoCache[reviewMission.id]}
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
