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
import ResetProgressDialog from "@/components/ResetProgressDialog";
import { missionsService } from "@/services";
import type { MissionWithProgress } from "@/services/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
  const { isAuthenticated, isAdmin } = useAuth();
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

  const reloadMissions = useCallback((signal?: AbortSignal) => {
    return missionsService
      .loadAll(signal)
      .then(setMissions)
      .catch(() => {
        /* swallow for mock */
      });
  }, []);

  // Load missions only after the user is authenticated.
  useEffect(() => {
    if (!isAuthenticated) {
      setMissions([]);
      setPhotoCache({});
      return;
    }
    const controller = new AbortController();
    reloadMissions(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, reloadMissions]);

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
      } else if (missionId === activeMissionId || isAdmin) {
        // admins can open any mission
        setOpenMissionId(missionId);
      }
    },
    [missions, activeMissionId, isAdmin]
  );

  const handlePhotoUpload = useCallback(
    async (missionId: number, photo: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;
      try {
        const upload = await missionsService.uploadPhoto(missionId, {
          base64Content: photo,
        });
        await missionsService.complete(missionId, { photoId: upload.photoId });
        setPhotoCache((c) => ({ ...c, [missionId]: photo }));
        setMissions((list) =>
          list.map((m) =>
            m.id === missionId
              ? { ...m, isComplete: true, photoUrl: `client://photo/${missionId}` }
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

  const handleReset = useCallback(
    async (scope: "self" | "all") => {
      try {
        await missionsService.adminReset(scope);
        setPhotoCache({});
        await reloadMissions();
        toast({
          title: "Progresso reposto",
          description: scope === "all" ? "Apagado para todos os jogadores." : "Apagado para o jogador atual.",
        });
      } catch {
        toast({ title: "Erro", description: "Não foi possível repor o progresso.", variant: "destructive" });
      }
    },
    [reloadMissions]
  );

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
          onPhotoUpload={handlePhotoUpload}
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
