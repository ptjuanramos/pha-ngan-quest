import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Minus, RefreshCw, RotateCcw, X } from "lucide-react";
import { adminService, missionsService } from "@/services";
import type { MissionStatusResponse, PlayerMissionStatusResponse } from "@/services/types";
import { toast } from "@/hooks/use-toast";
import ResetProgressDialog from "./ResetProgressDialog";

interface PhotoViewerState {
  playerId: number;
  username: string;
  mission: MissionStatusResponse;
}

const AdminDashboard = () => {
  const [data, setData] = useState<PlayerMissionStatusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [viewer, setViewer] = useState<PhotoViewerState | null>(null);
  const [viewerPhoto, setViewerPhoto] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await adminService.listAllMissions(signal);
      setData(res);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o painel.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Fetch photo data when viewer opens.
  useEffect(() => {
    if (!viewer) {
      setViewerPhoto(null);
      return;
    }
    const ctrl = new AbortController();
    setViewerLoading(true);
    setViewerPhoto(null);
    (async () => {
      try {
        // Prefer the photoUrl already returned by the admin endpoint.
        let blobUrl = viewer.mission.photoUrl;
        if (!blobUrl) {
          const meta = await missionsService.getPhoto(
            viewer.playerId,
            viewer.mission.missionId,
            ctrl.signal
          );
          blobUrl = meta?.blobUrl ?? "";
        }
        if (!blobUrl) {
          setViewerPhoto(null);
          return;
        }
        if (blobUrl.startsWith("data:")) {
          setViewerPhoto(blobUrl);
        } else {
          const dataUrl = await missionsService.fetchPhotoData(blobUrl, ctrl.signal);
          setViewerPhoto(dataUrl);
        }
      } catch {
        setViewerPhoto(null);
      } finally {
        setViewerLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [viewer]);

  const handleReset = useCallback(async () => {
    try {
      const result = await missionsService.adminReset();
      toast({
        title: "Progresso reposto",
        description: `Apagadas ${result.deletedCompletions} missões e ${result.deletedPhotos} fotos.`,
      });
      await load();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível repor o progresso.",
        variant: "destructive",
      });
    }
  }, [load]);

  const missionCols = data[0]?.missions ?? [];

  return (
    <div className="paper-texture min-h-screen px-4 pb-12 pt-20">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl text-foreground">Painel de administração</h1>
            <p className="mt-1 font-body text-sm italic text-muted-foreground">
              Vista geral do progresso de cada exploradora. Clica numa missão completa para ver a foto.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load()}
              className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-body text-sm font-semibold text-secondary-foreground shadow-sm transition active:scale-95"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
            <button
              onClick={() => setResetOpen(true)}
              className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2 font-body text-sm font-semibold text-destructive-foreground shadow-sm transition active:scale-95"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </header>

        {loading && data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 p-10 text-center font-body text-muted-foreground">
            A carregar...
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 p-10 text-center font-body text-muted-foreground">
            Ainda não há jogadoras registadas.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card/80 shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/80 px-4 py-3 font-heading text-sm uppercase tracking-wide text-foreground">
                    Jogadora
                  </th>
                  {missionCols.map((m) => (
                    <th
                      key={m.missionId}
                      className="px-3 py-3 text-center font-body text-xs font-semibold text-muted-foreground"
                      title={m.title}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-foreground">#{m.missionId}</span>
                        <span className="max-w-[7rem] truncate text-[10px] uppercase tracking-wide">
                          {m.title}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-body text-xs font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((player) => {
                  const completed = player.missions.filter((m) => m.completed).length;
                  return (
                    <tr key={player.playerId} className="border-t border-border">
                      <td className="sticky left-0 z-10 bg-card px-4 py-3 font-body text-sm font-semibold text-foreground">
                        {player.username}
                      </td>
                      {player.missions.map((m) => (
                        <td key={m.missionId} className="px-3 py-3 text-center">
                          <StatusCell
                            status={m}
                            onView={
                              m.completed
                                ? () =>
                                    setViewer({
                                      playerId: player.playerId,
                                      username: player.username,
                                      mission: m,
                                    })
                                : undefined
                            }
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center font-body text-sm font-semibold text-foreground">
                        {completed}/{player.missions.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ResetProgressDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={handleReset} />

      {viewer && (
        <PhotoViewer
          state={viewer}
          photo={viewerPhoto}
          loading={viewerLoading}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
};

interface StatusCellProps {
  status: MissionStatusResponse;
  onView?: () => void;
}

const StatusCell = ({ status, onView }: StatusCellProps) => {
  if (status.completed) {
    const when = status.completedAt
      ? new Date(status.completedAt).toLocaleString("pt-PT")
      : "";
    return (
      <button
        type="button"
        onClick={onView}
        title={`Ver foto${when ? ` · ${when}` : ""}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary transition hover:bg-primary/25 active:scale-90"
      >
        <Check size={14} />
      </button>
    );
  }
  if (status.validationStatus && status.validationStatus !== "NONE") {
    return (
      <span
        title={`Pendente · ${status.validationStatus}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent"
      >
        <Clock size={14} />
      </span>
    );
  }
  return (
    <span
      title="Por iniciar"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
    >
      <Minus size={14} />
    </span>
  );
};

interface PhotoViewerProps {
  state: PhotoViewerState;
  photo: string | null;
  loading: boolean;
  onClose: () => void;
}

const PhotoViewer = ({ state, photo, loading, onClose }: PhotoViewerProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const when = state.mission.completedAt
    ? new Date(state.mission.completedAt).toLocaleString("pt-PT")
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 px-4 fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow active:scale-90"
        >
          <X size={18} />
        </button>

        <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
          {loading ? (
            <span className="font-body text-sm text-muted-foreground">A carregar foto...</span>
          ) : photo ? (
            <img
              src={photo}
              alt={`Prova de ${state.username} — missão ${state.mission.missionId}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-body text-sm text-muted-foreground">Sem foto disponível.</span>
          )}
        </div>

        <div className="p-5">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {state.username} · Missão {state.mission.missionId}
          </p>
          <h3 className="mt-1 font-heading text-xl font-bold text-foreground">
            {state.mission.title}
          </h3>
          {when && (
            <p className="mt-2 font-body text-xs italic text-muted-foreground">
              Completa a {when}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
