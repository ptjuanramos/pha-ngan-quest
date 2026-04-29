import { useState, useEffect, useCallback, useRef } from "react";
import ProgressBar from "@/components/ProgressBar";
import LoginScreen from "@/components/LoginScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import TreasureMap from "@/components/TreasureMap";
import MissionSheet from "@/components/MissionSheet";
import CompletedMissionModal from "@/components/CompletedMissionModal";
import SignatureMoment from "@/components/SignatureMoment";
import QuestComplete from "@/components/QuestComplete";
import AdminBadge from "@/components/AdminBadge";
import AdminDashboard from "@/components/AdminDashboard";
import ResetProgressDialog from "@/components/ResetProgressDialog";
import { missionsService, playersService } from "@/services";
import { mergeMissionsWithCompletions } from "@/services/missionsService";
import type { MissionWithProgress } from "@/services/types";
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

  const inflightPhotoFetches = useRef<Set<number>>(new Set());

  useEffect(() => {
    saveUiState(ui);
  }, [ui]);

  /**
   * Reload the full game state for the current player:
   *  - GET /api/v1/missions
   *  - GET /api/v1/players/{playerId}/completions
   *  Then merge them into the UI's `MissionWithProgress[]` shape.
   */
  const reloadState = useCallback(
    async (signal?: AbortSignal) => {
      if (!playerId) return;
      try {
        const [rawMissions, completions] = await Promise.all([
          missionsService.loadAll(signal),
          playersService.listCompletions(playerId, signal),
        ]);
        setMissions(mergeMissionsWithCompletions(rawMissions, completions));
      } catch {
        /* swallow — keeps current state */
      }
    },
    [playerId]
  );

  // Load missions + completions only after the user is authenticated.
  useEffect(() => {
    if (!isAuthenticated || !playerId) {
      setMissions([]);
      setPhotoCache({});
      return;
    }
    // Hydrate the in-memory photo cache from session storage so navigations
    // don't trigger redundant photo fetches.
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

  // Lazy-fetch photo data for completed missions whose photo isn't cached yet.
  useEffect(() => {
    if (!playerId) return;
    missions.forEach((m) => {
      if (
        m.isComplete &&
        photoCache[m.id] === undefined &&
        !inflightPhotoFetches.current.has(m.id)
      ) {
        inflightPhotoFetches.current.add(m.id);
        (async () => {
          try {
            const meta = await missionsService.getPhoto(playerId, m.id);
            if (!meta) return;
            const dataUrl = await missionsService.fetchPhotoData(meta.blobUrl);
            if (!dataUrl) return;
            setPhotoCache((c) => {
              const next = { ...c, [m.id]: dataUrl };
              // Persist to sessionStorage so it survives reloads/route changes.
              const sessionCache = readPhotoCache();
              sessionCache[`${playerId}:${m.id}`] = dataUrl;
              writePhotoCache(sessionCache);
              return next;
            });
          } finally {
            inflightPhotoFetches.current.delete(m.id);
          }
        })();
      }
    });
  }, [missions, photoCache, playerId]);

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
   * Called by `ActiveMission` after upload + validation + complete have all
   * succeeded server-side. We just need to reflect it in the UI and prime
   * the photo cache.
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
      setMissions((list) =>
        list.map((m) =>
          m.id === missionId
            ? { ...m, isComplete: true, photoUrl: m.photoUrl ?? `client://photo/${missionId}` }
            : m
        )
      );
      setOpenMissionId(null);
      setSignatureMoment({ photo, clue: mission.clue, missionId });
    },
    [missions, playerId]
  );

  const handleAdminSkip = useCallback(
    async (missionId: number) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;
      try {
        await missionsService.adminSkip(missionId);
        setMissions((list) =>
          list.map((m) => (m.id === missionId ? { ...m, isComplete: true } : m))
        );
        setOpenMissionId(null);
        toast({ title: "Missão saltada", description: `"${mission.title}" marcada como completa.` });
      } catch {
        toast({ title: "Erro", description: "Não foi possível saltar a missão.", variant: "destructive" });
      }
    },
    [missions]
  );

  const handleReset = useCallback(async () => {
    try {
      const result = await missionsService.adminReset();
      setPhotoCache({});
      try {
        sessionStorage.removeItem(PHOTO_CACHE_KEY);
      } catch {
        /* ignore */
      }
      await reloadState();
      toast({
        title: "Progresso reposto",
        description: `Apagadas ${result.deletedCompletions} missões e ${result.deletedPhotos} fotos.`,
      });
    } catch {
      toast({ title: "Erro", description: "Não foi possível repor o progresso.", variant: "destructive" });
    }
  }, [reloadState]);

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

  // Admins go straight to the overview dashboard — they don't play the quest.
  if (isAdmin) {
    return (
      <div className="paper-texture min-h-screen">
        <AdminBadge />
        <AdminDashboard />
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
