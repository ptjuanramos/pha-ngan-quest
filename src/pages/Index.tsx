import { useState, useEffect, useCallback } from "react";
import ProgressBar from "@/components/ProgressBar";
import LoginScreen from "@/components/LoginScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import TreasureMap from "@/components/TreasureMap";
import MissionSheet from "@/components/MissionSheet";
import CompletedMissionModal from "@/components/CompletedMissionModal";
import SignatureMoment from "@/components/SignatureMoment";
import QuestComplete from "@/components/QuestComplete";
import AdminBadge from "@/components/AdminBadge";
import ResetProgressDialog from "@/components/ResetProgressDialog";
import { missionsService, playersService } from "@/services";
import { mergeMissionsWithCompletions } from "@/services/missionsService";
import type { MissionWithProgress, PersistedGameState } from "@/services/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "kpn-quest";
const PHOTO_CACHE_KEY = "kpn-photo-cache";

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

/** Per-session photo cache, keyed by `${playerId}:${missionId}` -> dataURL. */
function readPhotoCache(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(PHOTO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writePhotoCache(cache: Record<string, string>) {
  try {
    sessionStorage.setItem(PHOTO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

const Index = () => {
  const { isAuthenticated, isAdmin, playerId } = useAuth();
  const [ui, setUi] = useState<UiState>(loadUiState);
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [photoCache, setPhotoCache] = useState<Record<number, string>>({});
  const [openMissionId, setOpenMissionId] = useState<number | null>(null);
  const [reviewMissionId, setReviewMissionId] = useState<number | null>(null);
  const [signatureMoment, setSignatureMoment] = useState<{
    photo: string;
    clue: string;
    missionId: number;
  } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    saveUiState(ui);
  }, [ui]);

  /**
   * Reload the full game state for the current player:
   *  - GET /api/v1/missions
   *  - GET /api/v1/players/{playerId}/state
   *  Then merge them into `MissionWithProgress[]`.
   */
  const reloadState = useCallback(
    async (signal?: AbortSignal) => {
      if (!playerId) return;
      try {
        const [rawMissions, savedState] = await Promise.all([
          missionsService.loadAll(signal),
          playersService.getState(playerId, signal),
        ]);
        const parsed = playersService.parseState(savedState);
        setMissions(mergeMissionsWithCompletions(rawMissions, parsed.completedMissionIds));
      } catch {
        /* swallow — keeps current state */
      }
    },
    [playerId]
  );

  /**
   * Persist the player's progress to the backend.
   * Called whenever the set of completed missions changes.
   */
  const persistState = useCallback(
    async (completedMissionIds: number[]) => {
      if (!playerId) return;
      const state: PersistedGameState = { completedMissionIds };
      try {
        await playersService.saveState(playerId, {
          completedCount: completedMissionIds.length,
          stateJson: JSON.stringify(state),
        });
      } catch {
        /* best-effort; UI still reflects the change locally */
      }
    },
    [playerId]
  );

  // Load missions + state only after the user is authenticated.
  useEffect(() => {
    if (!isAuthenticated || !playerId) {
      setMissions([]);
      setPhotoCache({});
      return;
    }
    // Hydrate the in-memory photo cache from session storage so navigations
    // don't drop already-captured photos.
    const sessionCache = readPhotoCache();
    const scoped: Record<number, string> = {};
    Object.entries(sessionCache).forEach(([key, value]) => {
      const [pid, mid] = key.split(":");
      if (Number(pid) === playerId) scoped[Number(mid)] = value;
    });
    setPhotoCache(scoped);

    const controller = new AbortController();
    reloadState(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, playerId, reloadState]);

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
      } else if (missionId === activeMissionId || isAdmin) {
        setOpenMissionId(missionId);
      }
    },
    [missions, activeMissionId, isAdmin]
  );

  /**
   * Called by `ActiveMission` after upload + complete have succeeded
   * server-side. Reflect locally, cache the photo, and persist state.
   */
  const handleMissionComplete = useCallback(
    (missionId: number, photo: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission || !playerId) return;

      setPhotoCache((c) => {
        const next = { ...c, [missionId]: photo };
        const sessionCache = readPhotoCache();
        sessionCache[`${playerId}:${missionId}`] = photo;
        writePhotoCache(sessionCache);
        return next;
      });

      const nextMissions = missions.map((m) =>
        m.id === missionId
          ? { ...m, isComplete: true, photoUrl: m.photoUrl ?? `client://photo/${missionId}` }
          : m
      );
      setMissions(nextMissions);
      void persistState(nextMissions.filter((m) => m.isComplete).map((m) => m.id));

      setOpenMissionId(null);
      setSignatureMoment({ photo, clue: mission.clue, missionId });
    },
    [missions, playerId, persistState]
  );

  /**
   * Admin-only: skip a mission entirely. The spec has no dedicated endpoint,
   * so we synthesize one: upload a marker photo, complete the mission, and
   * save the updated state.
   */
  const handleAdminSkip = useCallback(
    async (missionId: number) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;
      try {
        const upload = await missionsService.uploadPhoto(missionId, {
          dataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        });
        await missionsService.complete(missionId, { photoId: upload.photoId });

        const nextMissions = missions.map((m) =>
          m.id === missionId ? { ...m, isComplete: true } : m
        );
        setMissions(nextMissions);
        void persistState(nextMissions.filter((m) => m.isComplete).map((m) => m.id));
        setOpenMissionId(null);
        toast({ title: "Missão saltada", description: `"${mission.title}" marcada como completa.` });
      } catch {
        toast({ title: "Erro", description: "Não foi possível saltar a missão.", variant: "destructive" });
      }
    },
    [missions, persistState]
  );

  /**
   * Admin-only: reset progress for all players. The API has no global reset
   * endpoint, so we clear the local photo cache and overwrite the current
   * player's saved state with an empty progress payload.
   */
  const handleReset = useCallback(async () => {
    if (!playerId) return;
    try {
      try {
        sessionStorage.removeItem(PHOTO_CACHE_KEY);
      } catch {
        /* ignore */
      }
      setPhotoCache({});
      await playersService.saveState(playerId, {
        completedCount: 0,
        stateJson: JSON.stringify({ completedMissionIds: [] } satisfies PersistedGameState),
      });
      await reloadState();
      toast({
        title: "Progresso reposto",
        description: "Apagado para todos os jogadores.",
      });
    } catch {
      toast({ title: "Erro", description: "Não foi possível repor o progresso.", variant: "destructive" });
    }
  }, [playerId, reloadState]);

  const handleSignatureComplete = useCallback(() => {
    setSignatureMoment(null);
  }, []);

  // ----- Render -----
  if (!isAuthenticated) {
    return (
      <div className="paper-texture min-h-screen">
        <LoginScreen />
      </div>
    );
  }

  if (!ui.started) {
    return (
      <div className="paper-texture min-h-screen">
        <AdminBadge onResetClick={() => setResetOpen(true)} />
        <WelcomeScreen onStart={handleStart} />
        <ResetProgressDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={handleReset} />
      </div>
    );
  }

  if (missions.length === 0) {
    return <div className="paper-texture min-h-screen" />;
  }

  if (isComplete) {
    return (
      <div className="paper-texture min-h-screen">
        <AdminBadge onResetClick={() => setResetOpen(true)} />
        <ProgressBar completedMissions={completedCount} />
        <div className="pt-2">
          <QuestComplete photos={photoCache} />
        </div>
        <ResetProgressDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={handleReset} />
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
      <AdminBadge onResetClick={() => setResetOpen(true)} />
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
          onMissionComplete={handleMissionComplete}
          onAdminSkip={isAdmin ? handleAdminSkip : undefined}
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

      <ResetProgressDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={handleReset} />
    </div>
  );
};

export default Index;
